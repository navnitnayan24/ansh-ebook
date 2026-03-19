const mongoose = require('mongoose');
const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');
const Category = require('../models/Category');
const Settings = require('../models/Settings');
const Subscriber = require('../models/Subscriber');

// Generic helper to get model by type
const getModel = (type) => {
    const normalizedType = (type || '').toLowerCase();
    if (normalizedType === 'shayari') return Shayari;
    if (normalizedType === 'music') return Music;
    if (normalizedType === 'podcast' || normalizedType === 'podcasts') return Podcast;
    if (normalizedType === 'ebook' || normalizedType === 'ebooks') return Ebook;
    return null;
};

exports.addContent = async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected. Please check your (.env) settings.' });
    }
    const { type } = req.params;
    const model = getModel(type);
    if (!model) return res.status(400).json({ error: 'Invalid content type' });

    try {
        const data = { ...req.body };

        // Handle Category Resolution (Name to ID)
        const normalizedType = type.toLowerCase();
        const section = normalizedType.replace(/s$/, ''); // handle plural to singular section
        
        if (data.category && !data.category_id) {
            let foundCat = await Category.findOne({ 
                name: { $regex: new RegExp(`^${data.category}$`, 'i') },
                section: section
            });
            
            if (!foundCat) {
                console.log(`[DB SAVE] Creating new category: ${data.category} for section: ${section}`);
                foundCat = new Category({ name: data.category, section: section });
                await foundCat.save();
            }
            data.category_id = foundCat._id;
        }

        // Handle File Upload or Manual URL Mapping
        if (req.file) {
            const uploadedUrl = `/uploads/${req.file.filename}`;
            if (['music', 'ebook', 'ebooks'].includes(type.toLowerCase())) {
                data.cover_url = uploadedUrl;
            } else if (['podcast', 'podcasts'].includes(type.toLowerCase())) {
                data.thumbnail_url = uploadedUrl;
            }
        } else {
            // Manual URL provided
            if (data.thumbnail) {
                if (['music', 'ebook', 'ebooks'].includes(type.toLowerCase())) {
                    data.cover_url = data.thumbnail;
                } else if (['podcast', 'podcasts'].includes(type.toLowerCase())) {
                    data.thumbnail_url = data.thumbnail;
                }
            }
        }

        console.log(`[DB SAVE] Saving ${type}:`, JSON.stringify(data));
        const item = new model(data);
        await item.save();
        
        const count = await model.countDocuments();
        console.log(`[DB SAVE SUCCESS] ${type} saved. New total count: ${count}`);
        
        res.status(201).json(item);
    } catch (err) {
        console.error(`[DB SAVE ERROR] ${type}:`, err);
        res.status(400).json({ error: err.message });
    }
};

exports.updateContent = async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected. Please check your (.env) settings.' });
    }
    const { type, id } = req.params;
    const model = getModel(type);
    if (!model) return res.status(400).json({ error: 'Invalid content type' });

    try {
        const data = { ...req.body };

        // Handle Category Resolution
        const normalizedType = type.toLowerCase();
        const section = normalizedType.replace(/s$/, '');
        
        if (data.category && !data.category_id) {
            let foundCat = await Category.findOne({ 
                name: { $regex: new RegExp(`^${data.category}$`, 'i') },
                section: section
            });
            
            if (!foundCat) {
                console.log(`[DB UPDATE] Creating new category: ${data.category} for section: ${section}`);
                foundCat = new Category({ name: data.category, section: section });
                await foundCat.save();
            }
            data.category_id = foundCat._id;
        }

        // Handle File Upload or Manual URL Mapping
        if (req.file) {
            const uploadedUrl = `/uploads/${req.file.filename}`;
            if (['music', 'ebook', 'ebooks'].includes(type.toLowerCase())) {
                data.cover_url = uploadedUrl;
            } else if (['podcast', 'podcasts'].includes(type.toLowerCase())) {
                data.thumbnail_url = uploadedUrl;
            }
        } else {
            // Manual URL provided
            if (data.thumbnail) {
                if (['music', 'ebook', 'ebooks'].includes(type.toLowerCase())) {
                    data.cover_url = data.thumbnail;
                } else if (['podcast', 'podcasts'].includes(type.toLowerCase())) {
                    data.thumbnail_url = data.thumbnail;
                }
            }
        }

        const item = await model.findByIdAndUpdate(id, data, { new: true });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        
        console.log(`[DB UPDATE SUCCESS] ${type} updated: ${id}`);
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteContent = async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected. Please check your (.env) settings.' });
    }
    const { type, id } = req.params;
    const model = getModel(type);
    if (!model) return res.status(400).json({ error: 'Invalid content type' });

    try {
        const item = await model.findByIdAndDelete(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.find();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSettings = async (req, res) => {
    const { key, value } = req.body;
    try {
        const setting = await Settings.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json(setting);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getSubscribers = async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ createdAt: -1 });
        res.json(subscribers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSubscriber = async (req, res) => {
    const { id } = req.params;
    try {
        const subscriber = await Subscriber.findByIdAndDelete(id);
        if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });
        res.json({ message: 'Subscriber removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
