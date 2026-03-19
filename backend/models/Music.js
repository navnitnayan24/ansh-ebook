const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, default: 'Ansh Sharma' },
    cover_url: { type: String },
    file_url: { type: String, required: true },
    duration: { type: String },
    category: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Music', musicSchema);
