const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const adminMiddleware = require('../middleware/adminMiddleware');

// All routes require admin authentication
router.get('/users', adminMiddleware, adminController.getAllUsers);
router.delete('/users/:userId', adminMiddleware, adminController.deleteUser);
router.post('/users/register', adminMiddleware, authController.register);
router.get('/users/:userId/chat-history', adminMiddleware, adminController.getChatHistoryByUser);
router.get('/users/:userId/download-chat', adminMiddleware, adminController.downloadChatHistory);
router.get('/dashboard/stats', adminMiddleware, adminController.getDashboardStats);

module.exports = router;