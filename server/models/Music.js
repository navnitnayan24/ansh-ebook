const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    title: { type: String, required: true },
    artist: { type: String, default: 'Ansh Sharma' },
    file_url: { type: String, required: true },
    cover_url: { type: String },
    duration: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Music', musicSchema);
