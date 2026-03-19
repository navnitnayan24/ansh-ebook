const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    section: { 
        type: String, 
        required: true, 
        enum: ['shayari', 'music', 'podcasts', 'ebooks'] 
    },
    name: { type: String, required: true },
});

// Ensure unique category per section
categorySchema.index({ section: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
