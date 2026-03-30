const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const upload = require('../middleware/uploadMiddleware');
const jwt = require('jsonwebtoken');

// Inline Auth Middleware for simplicity (copied from existing patterns if needed)
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

router.post('/', authenticate, upload.single('media'), statusController.createStatus);
router.get('/active', authenticate, statusController.getAllStories);
router.post('/view/:id', authenticate, statusController.viewStatus);
router.post('/like/:id', authenticate, statusController.likeStatus);
router.post('/reply/:id', authenticate, statusController.replyToStatus);
router.post('/comment/:id', authenticate, statusController.addCommentToStatus);
router.delete('/:id', authenticate, statusController.deleteStatus);

module.exports = router;
