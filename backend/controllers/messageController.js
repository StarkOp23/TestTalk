//! messageController

const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

exports.upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    })
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email')
    .sort({ timestamp: 1 });

    // Mark messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    res.json({
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Get unread message count per user
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get unread counts grouped by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: currentUserId,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format { userId: count }
    const countMap = {};
    unreadCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    res.json(countMap);
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};