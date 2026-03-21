const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate } = require('../controllers/authMiddleware');

router.get('/home', contentController.getHomeContent);
router.get('/categories', contentController.getCategories);

// Public settings (for scripts) — must be BEFORE /:type
router.get('/public/settings', async (req, res) => {
    const Settings = require('../models/Settings');
    try {
        const settings = await Settings.find();
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.key] = s.value);
        res.json(settingsObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Shayari — PUBLIC (no login required)
router.get('/shayari', (req, res) => {
    req.params.type = 'shayari';
    contentController.getContentByType(req, res);
});

// Music, Podcast, Ebook — LOGIN REQUIRED
router.get('/music', authenticate, (req, res) => {
    req.params.type = 'music';
    contentController.getContentByType(req, res);
});
router.get('/podcast', authenticate, (req, res) => {
    req.params.type = 'podcast';
    contentController.getContentByType(req, res);
});
router.get('/ebook', authenticate, (req, res) => {
    req.params.type = 'ebook';
    contentController.getContentByType(req, res);
});

// Legacy plural support (also protected)
router.get('/podcasts', authenticate, (req, res) => {
    req.params.type = 'podcast';
    contentController.getContentByType(req, res);
});
router.get('/ebooks', authenticate, (req, res) => {
    req.params.type = 'ebook';
    contentController.getContentByType(req, res);
});

router.post('/:type/:id/like', contentController.likeContent);

module.exports = router;
