const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');
const Category = require('../models/Category');
const Subscriber = require('../models/Subscriber');
const Review = require('../models/Review');
const User = require('../models/User');

exports.getHomeContent = async (req, res) => {
    try {
        const latestShayari = await Shayari.find().sort({ createdAt: -1 }).limit(6).populate('category_id');
        const latestMusic = await Music.find().sort({ createdAt: -1 }).limit(6).populate('category_id');
        const latestPodcasts = await Podcast.find().sort({ createdAt: -1 }).limit(4).populate('category_id');
        const featuredEbooks = await Ebook.find().sort({ createdAt: -1 }).limit(8).populate('category_id');

        // Helper to ensure absolute URLs for mobile/APK
        const ensureAbsolute = (item) => {
            const baseUrl = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'https://ansh-ebook.onrender.com';
            const doc = item.toObject();
            if (doc.file_url?.startsWith('/uploads')) doc.file_url = `${baseUrl}${doc.file_url}`;
            if (doc.cover_url?.startsWith('/uploads')) doc.cover_url = `${baseUrl}${doc.cover_url}`;
            if (doc.thumbnail?.startsWith('/uploads')) doc.thumbnail = `${baseUrl}${doc.thumbnail}`;
            if (doc.thumbnail_url?.startsWith('/uploads')) doc.thumbnail_url = `${baseUrl}${doc.thumbnail_url}`;
            return doc;
        };

        // Ensure no-cache for new updates
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        res.json({
            latest_shayari: latestShayari,
            latest_music: latestMusic.map(ensureAbsolute),
            latest_podcasts: latestPodcasts.map(ensureAbsolute),
            featured_ebooks: featuredEbooks.map(ensureAbsolute)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getContentByType = async (req, res) => {
    const { type } = req.params;
    const { category, q, limit = 0, offset = 0 } = req.query;
    
    let model;
    const normalizedType = type.toLowerCase();
    
    if (normalizedType === 'shayari') model = Shayari;
    else if (normalizedType === 'music') model = Music;
    else if (normalizedType === 'podcast' || normalizedType === 'podcasts') model = Podcast;
    else if (normalizedType === 'ebook' || normalizedType === 'ebooks') model = Ebook;
    else return res.status(400).json({ error: 'Invalid content type' });

    try {
        let query = {};
        if (category) query.category_id = category;
        if (q) {
            if (type === 'shayari') query.content = { $regex: q, $options: 'i' };
            else query.title = { $regex: q, $options: 'i' };
        }

        const items = await model.find(query)
            .populate('category_id')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));
            
        // Helper to ensure absolute URLs for mobile/APK
        const baseUrl = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'https://ansh-ebook.onrender.com';
        const processedItems = items.map(item => {
            const doc = item.toObject();
            if (doc.file_url?.startsWith('/uploads')) doc.file_url = `${baseUrl}${doc.file_url}`;
            if (doc.cover_url?.startsWith('/uploads')) doc.cover_url = `${baseUrl}${doc.cover_url}`;
            if (doc.thumbnail?.startsWith('/uploads')) doc.thumbnail = `${baseUrl}${doc.thumbnail}`;
            if (doc.thumbnail_url?.startsWith('/uploads')) doc.thumbnail_url = `${baseUrl}${doc.thumbnail_url}`;
            return doc;
        });

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(processedItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCategories = async (req, res) => {
    const { section } = req.query;
    try {
        let query = {};
        if (section) query.section = section;
        const categories = await Category.find(query).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.likeContent = async (req, res) => {
    const { type, id } = req.params;
    let model;
    const normalizedType = type.toLowerCase();
    
    if (normalizedType === 'shayari') model = Shayari;
    else if (normalizedType === 'music') model = Music;
    else if (normalizedType === 'podcast' || normalizedType === 'podcasts') model = Podcast;
    else if (normalizedType === 'ebook' || normalizedType === 'ebooks') model = Ebook;
    else return res.status(400).json({ error: 'Invalid content type' });

    try {
        const item = await model.findById(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (normalizedType === 'shayari') {
            const userId = req.user ? req.user.id : null;
            if (!userId) return res.status(401).json({ error: 'Must be logged in to like Shayari' });

            if (item.liked_by && item.liked_by.includes(userId)) {
                item.liked_by = item.liked_by.filter(uId => uId.toString() !== userId.toString());
                item.likes_count = Math.max(0, item.likes_count - 1);
            } else {
                if (!item.liked_by) item.liked_by = [];
                item.liked_by.push(userId);
                item.likes_count += 1;
            }
            await item.save();
            return res.json({ success: true, likes_count: item.likes_count, liked_by: item.liked_by });
        } else {
            // Legacy generic +1 like for others
            const updatedItem = await model.findByIdAndUpdate(id, { $inc: { likes_count: 1 } }, { new: true });
            return res.json({ success: true, likes_count: updatedItem.likes_count });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addComment = async (req, res) => {
    const { type, id } = req.params;
    const { text } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) return res.status(401).json({ error: 'Must be logged in to comment' });
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const normalizedType = type.toLowerCase();
    if (normalizedType !== 'shayari') return res.status(400).json({ error: 'Comments only supported on Shayari currently' });

    try {
        // Always fetch the real username from the DB to prevent ObjectID display
        const userRecord = await User.findById(userId).select('username');
        const resolvedUsername = userRecord?.username || req.body.username || 'User';

        const item = await Shayari.findById(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (!item.comments) item.comments = [];
        const newComment = {
            user_id: userId,
            username: resolvedUsername,
            text: text,
            createdAt: new Date()
        };
        
        item.comments.push(newComment);
        await item.save();
        
        res.status(201).json({ success: true, comment: newComment, comments: item.comments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateComment = async (req, res) => {
    const { type, id, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) return res.status(400).json({ error: 'Updated text is required' });

    try {
        const item = await Shayari.findById(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const comment = item.comments.id(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        // Only allow user to update their own comment
        if (comment.user_id.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized to update this comment' });
        }

        comment.text = text;
        comment.updatedAt = new Date();
        await item.save();

        res.json({ success: true, comments: item.comments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    const { type, id, commentId } = req.params;
    const userId = req.user.id;

    try {
        const item = await Shayari.findById(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const comment = item.comments.id(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        // Only allow user to delete their own comment
        if (comment.user_id.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Unauthorized to delete this comment' });
        }

        item.comments.pull(commentId);
        await item.save();

        res.json({ success: true, message: 'Comment deleted', comments: item.comments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.subscribe = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    try {
        const existing = await Subscriber.findOne({ email });
        if (existing) return res.status(400).json({ message: 'You are already in the circle! ✨' });
        
        const newSub = new Subscriber({ email });
        await newSub.save();
        res.status(201).json({ success: true, message: 'Welcome to the Inner Circle! ✨' });
    } catch (err) {
        res.status(500).json({ error: 'Subscription failed. Please try again later.' });
    }
};

// --- REVIEW SYSTEM ---
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 }).limit(10);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addReview = async (req, res) => {
    const { username, content, rating } = req.body;
    if (!username || !content || !rating) return res.status(400).json({ error: 'All fields are required' });
    
    try {
        const newReview = new Review({ username, content, rating });
        await newReview.save();
        res.status(201).json(newReview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateReviewReaction = async (req, res) => {
    const { id } = req.params;
    const { type } = req.body; // 'like' or 'dislike'
    const userId = req.user.id; // From authenticate middleware
    
    try {
        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        const hasLiked = review.likedBy.includes(userId);
        const hasDisliked = review.dislikedBy.includes(userId);

        if (type === 'like') {
            if (hasLiked) {
                // Toggle off
                review.likedBy = review.likedBy.filter(u => u.toString() !== userId);
                review.likes = Math.max(0, review.likes - 1);
            } else {
                // Remove dislike if exists
                if (hasDisliked) {
                    review.dislikedBy = review.dislikedBy.filter(u => u.toString() !== userId);
                    review.dislikes = Math.max(0, review.dislikes - 1);
                }
                review.likedBy.push(userId);
                review.likes += 1;
            }
        } else if (type === 'dislike') {
            if (hasDisliked) {
                // Toggle off
                review.dislikedBy = review.dislikedBy.filter(u => u.toString() !== userId);
                review.dislikes = Math.max(0, review.dislikes - 1);
            } else {
                // Remove like if exists
                if (hasLiked) {
                    review.likedBy = review.likedBy.filter(u => u.toString() !== userId);
                    review.likes = Math.max(0, review.likes - 1);
                }
                review.dislikedBy.push(userId);
                review.dislikes += 1;
            }
        }

        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.toggleFavorite = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const music = await Music.findById(id);
        if (!music) return res.status(404).json({ error: 'Music not found' });

        const isFav = user.favorites.some(fav => fav.toString() === id);
        
        if (isFav) {
            // Remove from user favorites
            user.favorites = user.favorites.filter(fav => fav.toString() !== id);
            // Remove from music likes
            if (music.likedBy) {
                music.likedBy = music.likedBy.filter(uId => uId.toString() !== userId.toString());
                music.likes_count = Math.max(0, music.likes_count - 1);
            }
        } else {
            // Add to user favorites
            user.favorites.push(id);
            // Add to music likes
            if (!music.likedBy) music.likedBy = [];
            music.likedBy.push(userId);
            music.likes_count += 1;
        }

        await user.save();
        await music.save();

        const updatedUser = await User.findById(userId).populate('favorites');
        res.json({ success: true, favorites: updatedUser.favorites, likes_count: music.likes_count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPlaylist = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    if (!name) return res.status(400).json({ error: 'Playlist name is required' });
    try {
        const user = await User.findById(userId);
        user.playlists.push({ name, songs: [] });
        await user.save();
        res.status(201).json({ success: true, playlists: user.playlists });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addToPlaylist = async (req, res) => {
    const { playlistId, songId } = req.params;
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        const playlist = user.playlists.id(playlistId);
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        
        // Use string comparison for ObjectIDs
        const alreadyExists = playlist.songs.some(s => s.toString() === songId);
        
        if (!alreadyExists) {
            playlist.songs.push(songId);
            await user.save();
        }

        const updatedUser = await User.findById(userId).populate('playlists.songs');
        res.json({ success: true, playlists: updatedUser.playlists });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeFromPlaylist = async (req, res) => {
    const { playlistId, songId } = req.params;
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        const playlist = user.playlists.id(playlistId);
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        
        playlist.songs = playlist.songs.filter(s => s.toString() !== songId);
        await user.save();
        res.json({ success: true, playlists: user.playlists });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserLibrary = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId)
            .populate('favorites')
            .populate('playlists.songs');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            favorites: user.favorites,
            playlists: user.playlists
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
