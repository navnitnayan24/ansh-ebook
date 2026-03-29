const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../../controllers/authMiddleware'); // Reusing existing auth middleware
const adminController = require('../../controllers/adminController');

router.use(authenticate); // All realtime routes require authentication

router.get('/cloudinary-signature', adminController.getCloudinarySignature);

router.get('/chats', chatController.getChats);
router.get('/messages/:chatId', chatController.getMessages);
router.get('/users', chatController.getUsers);
router.post('/chats', chatController.findOrCreateChat);
router.post('/groups', chatController.createGroupChat);
router.post('/add-member', chatController.addMemberToGroup);
router.post('/remove-member', chatController.removeMemberFromGroup);
router.post('/update-group', chatController.updateGroupDetails);
router.post('/leave-group', chatController.leaveGroup);
router.post('/join-group-code', chatController.joinGroupByCode);
router.post('/accept-invite/:chatId', chatController.acceptInvite);
router.post('/reject-invite/:chatId', chatController.rejectInvite);
router.post('/pin', chatController.pinMessage);

module.exports = router;
