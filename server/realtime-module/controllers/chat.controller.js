const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../../models/User');

// Get all chats for the current user
exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ 
            $or: [
                { participants: req.user.id },
                { pendingParticipants: req.user.id }
            ]
        })
            .populate('participants', 'username profile_pic bio _id')
            .populate('pendingParticipants', 'username profile_pic bio _id')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get messages for a specific chat
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate('sender', 'username profile_pic bio _id')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Find or Create a one-to-one chat
exports.findOrCreateChat = async (req, res) => {
    const { userId } = req.body;
    try {
        let chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [req.user.id, userId], $size: 2 }
        })
        .populate('participants', 'username profile_pic bio _id')
        .populate('lastMessage');

        if (!chat) {
            chat = await Chat.create({
                participants: [req.user.id, userId],
                isGroup: false
            });
            chat = await chat.populate('participants', 'username profile_pic bio _id');
        }
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a group chat
exports.createGroupChat = async (req, res) => {
    const { name, participants, groupIcon, description } = req.body;
    try {
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const chat = await Chat.create({
            name,
            participants: [...(participants || []), req.user.id],
            isGroup: true,
            groupIcon: groupIcon || 'https://res.cloudinary.com/datao7ela/image/upload/v1711516000/default-group_vqc6vz.png',
            description,
            joinCode,
            admin: req.user.id
        });
        const populatedChat = await chat.populate('participants', 'username profile_pic bio _id');
        res.json(populatedChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Join group by code
exports.joinGroupByCode = async (req, res) => {
    const { joinCode } = req.body;
    try {
        const chat = await Chat.findOne({ joinCode, isGroup: true });
        if (!chat) return res.status(404).json({ error: 'Invalid join code' });

        if (!chat.participants.includes(req.user.id)) {
            chat.participants.push(req.user.id);
            await chat.save();
        }

        const populatedChat = await chat.populate('participants', 'username profile_pic bio _id');
        res.json(populatedChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pin a message
exports.pinMessage = async (req, res) => {
    const { chatId, messageId } = req.body;
    try {
        const chat = await Chat.findByIdAndUpdate(chatId, { pinnedMessage: messageId }, { new: true })
            .populate('pinnedMessage')
            .populate('participants', 'username profile_pic bio _id');
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add a member to a group
exports.addMemberToGroup = async (req, res) => {
    const { chatId, userId } = req.body;
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        // Check if requester is admin
        if (chat.admin?.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only admins can add members' });
        }

        // Add to pending if not already a participant or pending
        if (!chat.participants.includes(userId) && !chat.pendingParticipants.includes(userId)) {
            chat.pendingParticipants.push(userId);
            await chat.save();
        }
        
        const populatedChat = await chat.populate('participants pendingParticipants', 'username profile_pic bio _id');
        
        // Notify the invited user via socket
        const { getIo } = require('../socket');
        const io = getIo();
        if (io) {
            io.to(userId.toString()).emit('chat-invite', populatedChat);
        }

        res.json(populatedChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Remove a member from a group
exports.removeMemberFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        if (chat.admin?.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only admins can remove members' });
        }

        chat.participants = chat.participants.filter(p => p.toString() !== userId);
        await chat.save();

        const populatedChat = await chat.populate('participants', 'username profile_pic bio _id');
        
        // Notify the removed user via socket so their sidebar updates
        const { getIo } = require('../socket');
        const io = getIo();
        if (io) {
            io.to(userId.toString()).emit('chat-removed', { chatId });
        }

        res.json(populatedChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update group details
exports.updateGroupDetails = async (req, res) => {
    const { chatId, name, description } = req.body;
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        if (chat.admin?.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only admins can edit group' });
        }

        if (name) chat.name = name;
        if (description) chat.description = description;
        if (req.body.groupIcon) chat.groupIcon = req.body.groupIcon;
        await chat.save();

        const populatedChat = await chat.populate('participants', 'username profile_pic bio _id');
        res.json(populatedChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Leave group
exports.leaveGroup = async (req, res) => {
    const { chatId } = req.body;
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        chat.participants = chat.participants.filter(p => p?.toString() !== req.user.id);
        
        // If the admin is leaving, assign someone else or delete (for now just assign if participants exist)
        if (chat.admin?.toString() === req.user.id && chat.participants.length > 0) {
            chat.admin = chat.participants[0];
        }

        await chat.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Accept an invitation
exports.acceptInvite = async (req, res) => {
    const { chatId } = req.params;
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        const userId = req.user.id;
        
        // Move from pending to active participants
        if (chat.pendingParticipants.includes(userId)) {
            chat.pendingParticipants.push(userId); // ensure it's there? No, pull then push
            chat.pendingParticipants = chat.pendingParticipants.filter(p => p?.toString() !== userId);
            
            if (!chat.participants.includes(userId)) {
                chat.participants.push(userId);
            }
            await chat.save();
        }

        const populatedChat = await chat.populate('participants pendingParticipants', 'username profile_pic bio _id');
        res.json(populatedChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reject/Cancel an invitation
exports.rejectInvite = async (req, res) => {
    const { chatId } = req.params;
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        const userId = req.user.id;
        
        // Only allow rejection if user is pending OR is the admin canceling an invite
        const isAdmin = chat.admin?.toString() === userId;
        const targetUserId = req.body.userId || userId; // if admin is canceling, they send the userId
        
        chat.pendingParticipants = chat.pendingParticipants.filter(p => p?.toString() !== targetUserId);
        await chat.save();
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all users for chat discovery
// ... (rest of the file)
exports.getUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const query = q ? { username: { $regex: q, $options: 'i' } } : {};
        const users = await User.find(query, 'username profile_pic bio _id')
            .limit(100);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Seed Kohinoor Group (Internal)
exports.seedKohinoorGroup = async () => {
    try {
        const existing = await Chat.findOne({ name: /Kohinoor/i, isGroup: true });
        if (existing) {
            console.log('💎 Kohinoor Group already exists. Skipping seed.');
            return;
        }

        // Find an admin user to be the owner
        const admin = await User.findOne({ role: 'admin' }) || await User.findOne();
        if (!admin) {
            console.log('⚠️ No users found to assign as Kohinoor admin. Skipping seed.');
            return;
        }

        const chat = await Chat.create({
            name: '🔥 🌹 Kohinoor 🌹 🔥',
            description: 'Premium real-time collaboration & private messaging for the Ansh Ebook community.',
            participants: [admin._id],
            isGroup: true,
            groupIcon: 'https://res.cloudinary.com/datao7ela/image/upload/v1711516000/default-group_vqc6vz.png',
            admin: admin._id
        });
        console.log('✅ Kohinoor Group seeded successfully.');
    } catch (err) {
        console.error('❌ Error seeding Kohinoor group:', err);
    }
};
