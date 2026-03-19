const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');

// Helper for filtering
const getFilteredContent = async (Model, req) => {
    const { q, category } = req.query;
    let query = {};
    if (q) {
        query.$or = [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ];
    }
    if (category) {
        query.category = category;
    }
    return await Model.find(query).sort({ createdAt: -1 });
};

// Shayari Controllers
const getShayari = async (req, res) => {
    try {
        const items = await getFilteredContent(Shayari, req);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching shayari' });
    }
};

const createShayari = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }
        const item = await Shayari.create(data);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error creating shayari' });
    }
};

const updateShayari = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }
        const item = await Shayari.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating shayari' });
    }
};

const deleteShayari = async (req, res) => {
    try {
        await Shayari.findByIdAndDelete(req.params.id);
        res.json({ message: 'Shayari deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting shayari' });
    }
};

// Music Controllers
const getMusic = async (req, res) => {
    try {
        const items = await getFilteredContent(Music, req);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching music' });
    }
};

const createMusic = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            data.cover_url = data.thumbnail;
        }
        const item = await Music.create(data);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error creating music' });
    }
};

const updateMusic = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            data.cover_url = data.thumbnail;
        }
        const item = await Music.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating music' });
    }
};

const deleteMusic = async (req, res) => {
    try {
        await Music.findByIdAndDelete(req.params.id);
        res.json({ message: 'Music deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting music' });
    }
};

// Podcast Controllers
const getPodcast = async (req, res) => {
    try {
        const items = await getFilteredContent(Podcast, req);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching podcasts' });
    }
};

const createPodcast = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            data.thumbnail_url = data.thumbnail;
        }
        const item = await Podcast.create(data);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error creating podcast' });
    }
};

const updatePodcast = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            data.thumbnail_url = data.thumbnail;
        }
        const item = await Podcast.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating podcast' });
    }
};

const deletePodcast = async (req, res) => {
    try {
        await Podcast.findByIdAndDelete(req.params.id);
        res.json({ message: 'Podcast deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting podcast' });
    }
};

// Ebook Controllers
const getEbook = async (req, res) => {
    try {
        const items = await getFilteredContent(Ebook, req);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching ebooks' });
    }
};

const createEbook = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            data.cover_url = data.thumbnail;
        }
        const item = await Ebook.create(data);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error creating ebook' });
    }
};

const updateEbook = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.thumbnail = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            data.cover_url = data.thumbnail;
        }
        const item = await Ebook.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating ebook' });
    }
};

const deleteEbook = async (req, res) => {
    try {
        await Ebook.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ebook deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting ebook' });
    }
};

// Category Fetching (derived from existing items)
const getCategories = async (req, res) => {
    try {
        const { section } = req.params;
        let Model;
        if (section === 'shayari') Model = Shayari;
        else if (section === 'music') Model = Music;
        else if (section === 'podcast') Model = Podcast;
        else if (section === 'ebook') Model = Ebook;
        else return res.status(400).json({ message: 'Invalid section' });

        const categories = await Model.distinct('category');
        res.json(categories.map(c => ({ _id: c, name: c })));
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

module.exports = {
    getShayari, createShayari, updateShayari, deleteShayari,
    getMusic, createMusic, updateMusic, deleteMusic,
    getPodcast, createPodcast, updatePodcast, deletePodcast,
    getEbook, createEbook, updateEbook, deleteEbook,
    getCategories
};
