const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../../models/User'); // Reusing existing user model

// Get all chats for the current user
exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'username profile_pic')
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
            .populate('sender', 'username profile_pic')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Find or Create a one-to-one chat
exports.findOrCreateChat = async (req, res) => {
    const { userId } = req.body; // ID of the other person
    try {
        let chat = await Chat.findOne({
            participants: { $all: [req.user.id, userId], $size: 2 }
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [req.user.id, userId]
            });
        }
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all users for chat discovery (Privacy-safe: No emails)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'username profile_pic _id')
            .limit(100); // Sensible limit
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
