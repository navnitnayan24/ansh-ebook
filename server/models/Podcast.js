const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    title: { type: String, required: true },
    description: { type: String },
    file_url: { type: String, required: false },
    thumbnail_url: { type: String },
    duration: { type: String },
    body_content: { type: String },
    is_premium: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Podcast', podcastSchema);
