//! messageRoutes

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:userId', authMiddleware, messageController.getChatHistory);
router.post('/upload', authMiddleware, messageController.upload.single('file'), messageController.uploadFile);
router.get('/unread/count', authMiddleware, messageController.getUnreadCount);

module.exports = router;