const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    thumbnail_url: { type: String },
    file_url: { type: String, required: true },
    duration: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Podcast', podcastSchema);
