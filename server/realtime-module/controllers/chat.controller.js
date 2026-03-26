const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../../models/User'); // Reusing existing user model

// Get all chats for the current user
exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'name profilePic')
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
            .populate('sender', 'name')
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
