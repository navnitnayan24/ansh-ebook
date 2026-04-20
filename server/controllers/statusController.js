const Status = require('../models/Status');
const User = require('../models/User');
const Chat = require('../realtime-module/models/chat.model');
const Message = require('../realtime-module/models/message.model');
const Notification = require('../models/Notification');
const { getIo } = require('../realtime-module/socket');

exports.createStatus = async (req, res) => {
    try {
        let { caption, audioUrl, isMuted, mentions } = req.body;
        
        // Parse mentions array if it came as a JSON string from FormData
        if (typeof mentions === 'string') {
            try { mentions = JSON.parse(mentions); } 
            catch(e) { mentions = [mentions]; }
        }
        if (mentions && !Array.isArray(mentions)) {
            mentions = [mentions];
        }

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
            caption,
            audioUrl: audioUrl || '',
            isMuted: isMuted === 'true' || isMuted === true,
            mentions: mentions || []
        });

        await newStatus.save();
        
        // Notify mentioned users
        const io = getIo();
        if (mentions && Array.isArray(mentions)) {
            for (const mentionedId of mentions) {
                if (mentionedId.toString() !== req.user.id) {
                    await Notification.create({
                        recipient: mentionedId,
                        sender: req.user.id,
                        type: 'mention',
                        content: 'mentioned you in a story'
                    }).catch(e => console.error("Mention notification error:", e));
                    if (io) io.to(mentionedId.toString()).emit('receive-notification');
                }
            }
        }
        
        // Notify all users about new status (for the ring update)
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
        const currentUser = await User.findById(req.user.id);
        const followingIds = currentUser.following || [];
        
        // Find active statuses from self, followed users, OR where user is mentioned
        const statuses = await Status.find({
            $or: [
                { user: { $in: [...followingIds, req.user.id] } },
                { mentions: req.user.id }
            ]
        })
            .populate('user', 'username profile_pic')
            .populate('views.user', 'username profile_pic')
            .populate('likes', 'username profile_pic')
            .populate('comments.user', 'username profile_pic')
            .populate('mentions', 'username profile_pic')
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
            if (req.user.id !== status.user.toString()) {
                await Notification.create({
                    recipient: status.user,
                    sender: req.user.id,
                    type: 'like',
                    content: 'liked your story'
                }).catch(e => console.error("Notification errored (likely duplicate logic): ", e));
                
                const io = getIo();
                if (io) io.to(status.user.toString()).emit('receive-notification');
            }
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
            
            if (senderId !== receiverId.toString()) {
                await Notification.create({
                    recipient: receiverId,
                    sender: senderId,
                    type: 'reply',
                    content: `Replied: ${text}`,
                    chatId: chat._id
                });
                io.to(receiverId.toString()).emit('receive-notification');
            }
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
            
            if (req.user.id !== status.user.toString()) {
                await Notification.create({
                    recipient: status.user,
                    sender: req.user.id,
                    type: 'comment',
                    content: text
                });
                io.to(status.user.toString()).emit('receive-notification');
            }
        }

        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
