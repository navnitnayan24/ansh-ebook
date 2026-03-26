const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../../controllers/authMiddleware'); // Reusing existing auth middleware

router.use(authenticate); // All realtime routes require authentication

router.get('/chats', chatController.getChats);
router.get('/messages/:chatId', chatController.getMessages);
router.get('/users', chatController.getUsers);
router.post('/chats', chatController.findOrCreateChat);

module.exports = router;
