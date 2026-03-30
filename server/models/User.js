const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile_pic: { type: String },
    bio: { type: String, default: 'Premium Ansh Ebook User' },
    link: { type: String },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }],
    playlists: [{
        name: { type: String, required: true },
        songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }]
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
