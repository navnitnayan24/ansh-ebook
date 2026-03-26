const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const auth = require('../../middleware/authMiddleware'); // Reusing existing auth middleware

router.use(auth); // All realtime routes require authentication

router.get('/chats', chatController.getChats);
router.get('/messages/:chatId', chatController.getMessages);
router.post('/chats', chatController.findOrCreateChat);

module.exports = router;
