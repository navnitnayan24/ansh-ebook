const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    cover_url: { type: String },
    file_url: { type: String }, // Optional, maybe external link or download
    price: { type: Number, default: 0 },
    category: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Ebook', ebookSchema);
