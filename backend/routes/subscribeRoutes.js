const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const { protect, admin } = require('../middleware/auth');

router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    
    try {
        const exists = await Subscriber.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Already subscribed' });
        }
        
        await Subscriber.create({ email });
        res.status(201).json({ message: 'Subscription successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin only: Get all subscribers
router.get('/subscribers', protect, admin, async (req, res) => {
    try {
        const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin only: Delete a subscriber
router.delete('/subscribers/:id', protect, admin, async (req, res) => {
    try {
        await Subscriber.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subscriber removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
