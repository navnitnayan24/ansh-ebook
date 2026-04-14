const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const jwt = require('jsonwebtoken');

// Inline Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.post('/read/:id', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
