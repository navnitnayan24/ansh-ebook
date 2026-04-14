const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'message', 'call', 'reply'],
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 604800 } // Keep notifications for 7 days
    }
}, { timestamps: true });

// Prevent duplicate rapid notifications from the same sender for the same type (like spamming 'like')
notificationSchema.index({ recipient: 1, sender: 1, type: 1, chatId: 1 }, { background: true });

module.exports = mongoose.model('Notification', notificationSchema);
