const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');
const Category = require('../models/Category');
const Subscriber = require('../models/Subscriber');
const Review = require('../models/Review');

exports.getHomeContent = async (req, res) => {
    try {
        const latestShayari = await Shayari.find().sort({ createdAt: -1 }).limit(3).populate('category_id');
        const latestMusic = await Music.find().sort({ createdAt: -1 }).limit(3).populate('category_id');
        const latestPodcasts = await Podcast.find().sort({ createdAt: -1 }).limit(2).populate('category_id');
        const featuredEbooks = await Ebook.find().sort({ createdAt: -1 }).limit(4).populate('category_id');

        res.json({
            latest_shayari: latestShayari,
            latest_music: latestMusic,
            latest_podcasts: latestPodcasts,
            featured_ebooks: featuredEbooks
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
            
        res.json(items);
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
        const item = await model.findByIdAndUpdate(id, { $inc: { likes_count: 1 } }, { new: true });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ success: true, likes_count: item.likes_count });
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
    
    try {
        const update = type === 'like' ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
        const review = await Review.findByIdAndUpdate(id, update, { new: true });
        if (!review) return res.status(404).json({ error: 'Review not found' });
        res.json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
