const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    author: { type: String },
    cover_url: { type: String },
    file_url: { type: String, required: true },
    price: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Ebook', ebookSchema);
