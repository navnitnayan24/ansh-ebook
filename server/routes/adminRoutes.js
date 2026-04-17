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
router.delete('/categories/:id', adminController.deleteCategory);
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);

// Subscribers
router.get('/subscribers', adminController.getSubscribers);
router.delete('/subscribers/:id', adminController.deleteSubscriber);

// Users
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

// Cloudinary
router.get('/cloudinary-signature', adminController.getCloudinarySignature);

// Chat Investigation
router.get('/chats', adminController.getAdminAllChats);
router.get('/chats/:chatId/messages', adminController.getAdminChatMessages);

router.post('/:type', (req, res, next) => {
    console.log(`[ADMIN POST] Target: ${req.params.type}`);
    next();
}, upload.any(), adminController.addContent);
router.put('/:type/:id', upload.any(), adminController.updateContent);
router.delete('/:type/:id', adminController.deleteContent);

module.exports = router;
