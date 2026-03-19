const mongoose = require('mongoose');

const shayariSchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    content: { type: String, required: true },
    likes_count: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Shayari', shayariSchema);
