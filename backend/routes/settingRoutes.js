const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, admin } = require('../middleware/auth');

// Public: Get all public settings (e.g. AdSense script)
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.find({});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin only: Upsert a setting
router.post('/', protect, admin, async (req, res) => {
    const { key, value, description } = req.body;
    try {
        let setting = await Setting.findOne({ key });
        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
            await setting.save();
        } else {
            setting = await Setting.create({ key, value, description });
        }
        res.status(200).json(setting);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
