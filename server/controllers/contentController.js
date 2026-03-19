const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');
const Category = require('../models/Category');

exports.getHomeContent = async (req, res) => {
    try {
        const latestShayari = await Shayari.find().sort({ createdAt: -1 }).limit(3);
        const latestMusic = await Music.find().sort({ createdAt: -1 }).limit(3);
        const latestPodcasts = await Podcast.find().sort({ createdAt: -1 }).limit(2);
        const featuredEbooks = await Ebook.find().sort({ createdAt: -1 }).limit(4);

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

        console.log(`[GET CONTENT] Type: ${type}, Category: ${category}, Query: ${q}`);
        
        const hasCategory = ['shayari', 'music'].includes(normalizedType);
        const items = await model.find(query)
            .populate(hasCategory ? 'category_id' : '')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));
            
        console.log(`[GET CONTENT] Returning ${items.length} items for ${type}`);
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
