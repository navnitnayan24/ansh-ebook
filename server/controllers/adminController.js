const mongoose = require('mongoose');
const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');
const Category = require('../models/Category');
const Settings = require('../models/Settings');
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');
const Review = require('../models/Review');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCloudinarySignature = (req, res) => {
    try {
        const cloudinary = require('cloudinary').v2;
        const timestamp = Math.round((new Date()).getTime() / 1000);
        // The timestamp must be signed
        const signature = cloudinary.utils.api_sign_request({ timestamp: timestamp }, process.env.CLOUDINARY_API_SECRET);
        
        res.json({ 
            signature, 
            timestamp, 
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate signature' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Generic helper to get model by type
const getModel = (type) => {
    const normalizedType = (type || '').toLowerCase();
    if (normalizedType === 'shayari') return Shayari;
    if (normalizedType === 'music') return Music;
    if (normalizedType === 'podcast' || normalizedType === 'podcasts') return Podcast;
    if (normalizedType === 'ebook' || normalizedType === 'ebooks') return Ebook;
    if (normalizedType === 'review' || normalizedType === 'reviews') return Review;
    return null;
};

exports.addContent = async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected. Please check your (.env) settings.' });
    }
    const { type } = req.params;
    const model = getModel(type);
    if (!model) {
        console.error(`[ADMIN ERROR] Invalid content type: ${type}`);
        return res.status(400).json({ error: 'Invalid content type' });
    }

    try {
        const data = { ...req.body };

        // Handle Category Resolution (Name to ID)
        const normalizedType = type.toLowerCase();
        let section = normalizedType;
        if (normalizedType === 'podcast') section = 'podcasts';
        if (normalizedType === 'ebook') section = 'ebooks';
        
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

        // --- NEW: Robustify category_id (Fix for 400/404 errors) ---
        if (data.category_id === "" || data.category_id === "null" || data.category_id === undefined) {
            delete data.category_id;
        } else if (data.category_id && !mongoose.Types.ObjectId.isValid(data.category_id)) {
            console.warn(`[DB SAVE] Invalid category_id provided: "${data.category_id}". Removing from payload.`);
            delete data.category_id;
        }

        // Handle File Upload or Manual URL Mapping
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                // multer-storage-cloudinary sets the URL in file.path (Cloudinary URL)
                // file.secure_url may be undefined in some versions, so fallback to file.path
                let uploadedUrl = file.path || file.secure_url;
                if (!uploadedUrl || !uploadedUrl.startsWith('http')) {
                    // Local fallback
                    uploadedUrl = `/uploads/${file.filename}`;
                }
                console.log(`[FILE UPLOAD] field=${file.fieldname}, url=${uploadedUrl}`);
                if (file.fieldname === 'thumbnail') {
                    data.thumbnail = uploadedUrl;
                    if (['music', 'ebook', 'ebooks'].includes(type.toLowerCase())) {
                        data.cover_url = uploadedUrl;
                    } else if (['podcast', 'podcasts'].includes(type.toLowerCase())) {
                        data.thumbnail_url = uploadedUrl;
                    }
                } else if (file.fieldname === 'audio_file' || file.fieldname === 'document_file' || file.fieldname === 'file') {
                    data.file_url = uploadedUrl;
                }
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
        
        const audioUrl = item.file_url || '';
        const imageUrl = item.thumbnail || item.cover_url || item.thumbnail_url || '';
        const pdfUrl = item.file_url || '';
        console.log(`[DB SAVE URLS] Audio: ${audioUrl}, Image: ${imageUrl}, PDF: ${pdfUrl}`);
        
        res.status(201).json({
            ...item._doc,
            title: item.title,
            audioUrl: audioUrl,
            imageUrl: imageUrl,
            pdfUrl: pdfUrl
        });
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
        let section = normalizedType;
        if (normalizedType === 'podcast') section = 'podcasts';
        if (normalizedType === 'ebook') section = 'ebooks';
        
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
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                // multer-storage-cloudinary sets the URL in file.path (Cloudinary URL)
                // file.secure_url may be undefined in some versions, so fallback to file.path
                let uploadedUrl = file.path || file.secure_url;
                if (!uploadedUrl || !uploadedUrl.startsWith('http')) {
                    // Local fallback
                    uploadedUrl = `/uploads/${file.filename}`;
                }
                console.log(`[FILE UPDATE] field=${file.fieldname}, url=${uploadedUrl}`);
                if (file.fieldname === 'thumbnail') {
                    data.thumbnail = uploadedUrl;
                    if (['music', 'ebook', 'ebooks'].includes(type.toLowerCase())) {
                        data.cover_url = uploadedUrl;
                    } else if (['podcast', 'podcasts'].includes(type.toLowerCase())) {
                        data.thumbnail_url = uploadedUrl;
                    }
                } else if (file.fieldname === 'audio_file' || file.fieldname === 'document_file' || file.fieldname === 'file') {
                    data.file_url = uploadedUrl;
                }
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
        
        const audioUrl = item.file_url || '';
        const imageUrl = item.thumbnail || item.cover_url || item.thumbnail_url || '';
        const pdfUrl = item.file_url || '';
        console.log(`[DB UPDATE URLS] Audio: ${audioUrl}, Image: ${imageUrl}, PDF: ${pdfUrl}`);
        
        res.json({
            ...item._doc,
            title: item.title,
            audioUrl: audioUrl,
            imageUrl: imageUrl,
            pdfUrl: pdfUrl
        });
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

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findByIdAndDelete(id);
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
