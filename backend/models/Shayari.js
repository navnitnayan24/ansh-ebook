const mongoose = require('mongoose');

const shayariSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: String, default: 'Ansh Sharma' },
    category: { type: String, required: true }, // e.g., 'Love', 'Sad', 'Motivation'
    likes_count: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Shayari', shayariSchema);
