const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../../models/User');

// Get all chats for the current user
exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'username profile_pic _id')
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
            .populate('sender', 'username profile_pic _id')
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
        .populate('participants', 'username profile_pic _id')
        .populate('lastMessage');

        if (!chat) {
            chat = await Chat.create({
                participants: [req.user.id, userId],
                isGroup: false
            });
            chat = await chat.populate('participants', 'username profile_pic _id');
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
        const chat = await Chat.create({
            name,
            participants: [...participants, req.user.id],
            isGroup: true,
            groupIcon: groupIcon || 'https://res.cloudinary.com/datao7ela/image/upload/v1711516000/default-group_vqc6vz.png',
            description,
            admin: req.user.id
        });
        const populatedChat = await chat.populate('participants', 'username profile_pic _id');
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
            .populate('participants', 'username profile_pic _id');
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
        if (chat.admin.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only admins can add members' });
        }

        // Add if not already a participant
        if (!chat.participants.includes(userId)) {
            chat.participants.push(userId);
            await chat.save();
        }
        
        const populatedChat = await chat.populate('participants', 'username profile_pic _id');
        
        // Notify the added user via socket
        const { getIo } = require('../socket');
        const io = getIo();
        if (io) {
            io.to(userId.toString()).emit('chat-added', populatedChat);
        }

        res.json(populatedChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all users for chat discovery
exports.getUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const query = q ? { username: { $regex: q, $options: 'i' } } : {};
        const users = await User.find(query, 'username profile_pic _id')
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
