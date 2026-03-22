const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../controllers/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);

// Recovery & Password Management
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);

router.put('/profile', authenticate, upload.single('profile_pic'), authController.updateProfile);

module.exports = router;
