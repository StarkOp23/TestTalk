const User = require('../models/User');
const Message = require('../models/Message');
const { Parser } = require('json2csv');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Don't allow deleting admin
        if (user.isAdmin) {
            return res.status(403).json({
                error: 'Cannot delete admin user'
            });
        }

        // Delete user's messages
        await Message.deleteMany({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        });

        // Delete user
        await User.findByIdAndDelete(userId);

        res.json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get chat history for a user with date range
exports.getChatHistoryByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        // Build query
        const query = {
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        };

        // Add date range if provided
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // End of day
                query.timestamp.$lte = end;
            }
        }

        const messages = await Message.find(query)
            .populate('senderId', 'name email employeeId')
            .populate('receiverId', 'name email employeeId')
            .sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Download chat history as CSV
exports.downloadChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Build query
        const query = {
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        };

        // Add date range if provided
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }

        const messages = await Message.find(query)
            .populate('senderId', 'name email employeeId')
            .populate('receiverId', 'name email employeeId')
            .sort({ timestamp: 1 });

        // Format data for CSV
        const csvData = messages.map(msg => ({
            'Date': new Date(msg.timestamp).toLocaleString(),
            'From': msg.senderId.name,
            'From Email': msg.senderId.email,
            'From Employee ID': msg.senderId.employeeId,
            'To': msg.receiverId.name,
            'To Email': msg.receiverId.email,
            'To Employee ID': msg.receiverId.employeeId,
            'Message': msg.message || '[File Attachment]',
            'File Name': msg.fileName || '',
            'File URL': msg.fileUrl || '',
            'Read': msg.isRead ? 'Yes' : 'No'
        }));

        // Convert to CSV
        const parser = new Parser();
        const csv = parser.parse(csvData);

        // Set headers for file download
        const filename = `chat_history_${user.name}_${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isAdmin: false });
        const totalDevelopers = await User.countDocuments({ role: 'developer', isAdmin: false });
        const totalTesters = await User.countDocuments({ role: 'tester', isAdmin: false });
        const onlineUsers = await User.countDocuments({ isOnline: true, isAdmin: false });
        const totalMessages = await Message.countDocuments();

        // Get recent users
        const recentUsers = await User.find({ isAdmin: false })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalUsers,
            totalDevelopers,
            totalTesters,
            onlineUsers,
            totalMessages,
            recentUsers
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};