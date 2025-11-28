//! socketController

const User = require('../models/User');
const Message = require('../models/Message');

const userSockets = new Map(); // Store userId -> socketId mapping

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // User joins
        socket.on('user-connected', async (userId) => {
            userSockets.set(userId, socket.id);
            socket.userId = userId;

            // Update user online status
            await User.findByIdAndUpdate(userId, { isOnline: true });

            // Notify all users about online status
            io.emit('user-status-changed', { userId, isOnline: true });
        });

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { senderId, receiverId, message, fileUrl, fileName, fileType, fileSize } = data;

                // Save message to database
                const newMessage = new Message({
                    senderId,
                    receiverId,
                    message,
                    fileUrl,
                    fileName,
                    fileType,
                    fileSize
                });

                await newMessage.save();

                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('senderId', 'name email')
                    .populate('receiverId', 'name email');

                // Send to receiver if online
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive-message', populatedMessage);
                }

                // Send back to sender for confirmation (ONLY ONCE)
                socket.emit('message-sent', populatedMessage);

                // Send notification to receiver
                if (receiverSocketId) {
                    const sender = await User.findById(senderId);
                    io.to(receiverSocketId).emit('new-notification', {
                        title: `New message from ${sender.name}`,
                        body: message || 'Sent a file',
                        senderId
                    });
                }

                // Broadcast unread count update to receiver
                if (receiverSocketId) {
                    const unreadCount = await Message.countDocuments({
                        senderId,
                        receiverId,
                        isRead: false
                    });

                    io.to(receiverSocketId).emit('unread-count-update', {
                        senderId,
                        count: unreadCount
                    });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Mark messages as read
        socket.on('mark-as-read', async (data) => {
            try {
                const { senderId, receiverId } = data;
                await Message.updateMany(
                    { senderId, receiverId, isRead: false },
                    { isRead: true }
                );

                // Notify sender that messages were read
                const senderSocketId = userSockets.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messages-read', { receiverId });
                }

                // Update unread count for receiver
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('unread-count-update', {
                        senderId,
                        count: 0
                    });
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const receiverSocketId = userSockets.get(data.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user-typing', {
                    senderId: data.senderId,
                    isTyping: data.isTyping
                });
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            if (socket.userId) {
                userSockets.delete(socket.userId);

                // Update user offline status
                await User.findByIdAndUpdate(socket.userId, {
                    isOnline: false,
                    lastSeen: new Date()
                });

                // Notify all users about offline status
                io.emit('user-status-changed', { userId: socket.userId, isOnline: false });
            }
            console.log('Client disconnected:', socket.id);
        });
    });
};