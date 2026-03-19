const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../controllers/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protect all admin routes
router.use((req, res, next) => {
    console.log(`[ADMIN ROUTE DEBUG] Incoming: ${req.method} ${req.url}`);
    next();
});
router.use(authenticate);
router.use(isAdmin);

router.post('/categories', adminController.addCategory);
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);

// Subscribers
router.get('/subscribers', adminController.getSubscribers);
router.delete('/subscribers/:id', adminController.deleteSubscriber);

router.post('/:type', upload.single('thumbnail'), adminController.addContent);
router.put('/:type/:id', upload.single('thumbnail'), adminController.updateContent);
router.delete('/:type/:id', adminController.deleteContent);

module.exports = router;
