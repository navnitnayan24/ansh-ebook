const Status = require('../models/Status');
const User = require('../models/User');
const Chat = require('../realtime-module/models/chat.model');
const Message = require('../realtime-module/models/message.model');
const { getIo } = require('../realtime-module/socket');

exports.createStatus = async (req, res) => {
    try {
        const { caption } = req.body;
        let mediaUrl = '';
        let mediaType = 'image';

        if (req.file) {
            mediaUrl = req.file.path || req.file.secure_url;
            if (req.file.mimetype.startsWith('video/')) {
                mediaType = 'video';
            }
        } else if (req.body.mediaUrl) {
            mediaUrl = req.body.mediaUrl;
            mediaType = req.body.mediaType || 'image';
        }

        if (!mediaUrl) {
            return res.status(400).json({ error: 'Media is required for status' });
        }

        const newStatus = new Status({
            user: req.user.id,
            mediaUrl,
            mediaType,
            caption
        });

        await newStatus.save();
        
        // Notify all users about new status (for the ring update)
        const io = getIo();
        if (io) {
            io.emit('new-status', { userId: req.user.id });
        }

        res.status(201).json(newStatus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllStories = async (req, res) => {
    try {
        // Find all active statuses and group them by user
        // MongoDB TTL index handles the 24h deletion automatically
        const statuses = await Status.find()
            .populate('user', 'username profile_pic')
            .populate('views.user', 'username profile_pic')
            .populate('likes', 'username profile_pic')
            .populate('comments.user', 'username profile_pic')
            .sort({ createdAt: -1 });

        // Grouping logic: Collect all statuses for each user
        const grouped = statuses.reduce((acc, status) => {
            const userId = status.user._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    user: status.user,
                    stories: []
                };
            }
            acc[userId].stories.push(status);
            return acc;
        }, {});

        res.json(Object.values(grouped));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.viewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Status.findById(id);
        if (!status) return res.status(404).json({ error: 'Status not found' });

        // Check if already viewed
        const alreadyViewed = status.views.some(v => v.user.toString() === req.user.id);
        if (!alreadyViewed) {
            status.views.push({ user: req.user.id });
            await status.save();
            
            // Notify the owner that someone saw their story
            const io = getIo();
            if (io) {
                io.to(status.user.toString()).emit('status-seen', { 
                    statusId: id, 
                    viewerId: req.user.id 
                });
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.likeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Status.findById(id);
        if (!status) return res.status(404).json({ error: 'Status not found' });

        const index = status.likes.indexOf(req.user.id);
        if (index === -1) {
            status.likes.push(req.user.id);
        } else {
            status.likes.splice(index, 1);
        }

        await status.save();
        res.json({ likes: status.likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.replyToStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const status = await Status.findById(id).populate('user');
        if (!status) return res.status(404).json({ error: 'Status not found' });

        const senderId = req.user.id;
        const receiverId = status.user._id;

        // Find or Create Chat
        let chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [senderId, receiverId] }
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [senderId, receiverId],
                isGroup: false
            });
        }

        // Create Message with status context
        const message = await Message.create({
            chat: chat._id,
            sender: senderId,
            text: `Replied to your story: "${text}"`,
            mediaUrl: status.mediaUrl, // Attach the story media for context
            mediaType: status.mediaType 
        });

        await Chat.findByIdAndUpdate(chat._id, { 
            lastMessage: message._id,
            $inc: { [`unreadCount.${receiverId}`]: 1 }
        });

        // Notify via Socket
        const io = getIo();
        if (io) {
            io.to(receiverId.toString()).emit('receive-message', message);
            io.to(senderId.toString()).emit('receive-message', message);
        }

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Status.findById(id);
        if (!status) return res.status(404).json({ error: 'Status not found' });

        if (status.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Unauthorized to delete this status' });
        }

        await Status.findByIdAndDelete(id);

        // Notify all users about status change (to update rings)
        const io = getIo();
        if (io) {
            io.emit('new-status', { userId: req.user.id });
        }

        res.json({ message: 'Status deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addCommentToStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const status = await Status.findById(id);
        if (!status) return res.status(404).json({ error: 'Status not found' });

        const comment = {
            user: req.user.id,
            text,
            createdAt: new Date()
        };

        status.comments.push(comment);
        await status.save();

        const populatedStatus = await Status.findById(id).populate('comments.user', 'username profile_pic');
        const newComment = populatedStatus.comments[populatedStatus.comments.length - 1];

        // Notify the owner
        const io = getIo();
        if (io) {
            io.to(status.user.toString()).emit('status-comment', { 
                statusId: id, 
                comment: newComment 
            });
        }

        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
