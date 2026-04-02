const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        trim: true
    },
    mediaUrl: {
        type: String
    },
    mediaType: {
        type: String,
        enum: ['image', 'video', 'audio', 'file', 'none'],
        default: 'none'
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    reactions: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            emoji: { type: String }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
