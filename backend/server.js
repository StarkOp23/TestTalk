// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"]
//     }
// });

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// // MongoDB Connection
// mongoose.connect('mongodb://localhost:27017/chatportal', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

// // User Schema
// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     employeeId: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['tester', 'developer'], required: true },
//     isOnline: { type: Boolean, default: false },
//     lastSeen: { type: Date, default: Date.now },
//     createdAt: { type: Date, default: Date.now }
// });

// const User = mongoose.model('User', userSchema);

// // Message Schema
// const messageSchema = new mongoose.Schema({
//     senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     message: { type: String },
//     fileUrl: { type: String },
//     fileName: { type: String },
//     fileType: { type: String },
//     fileSize: { type: Number },
//     isRead: { type: Boolean, default: false },
//     timestamp: { type: Date, default: Date.now }
// });

// const Message = mongoose.model('Message', messageSchema);

// // File upload configuration
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });

// const upload = multer({
//     storage,
//     limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
// });

// // JWT Secret
// const JWT_SECRET = 'your-secret-key-change-in-production';

// // Middleware to verify JWT
// const authenticateToken = (req, res, next) => {
//     const token = req.header('Authorization')?.replace('Bearer ', '');

//     if (!token) {
//         return res.status(401).json({ error: 'Access denied' });
//     }

//     try {
//         const verified = jwt.verify(token, JWT_SECRET);
//         req.user = verified;
//         next();
//     } catch (error) {
//         res.status(400).json({ error: 'Invalid token' });
//     }
// };

// // Routes

// // Register
// app.post('/api/auth/register', async (req, res) => {
//     try {
//         const { name, email, employeeId, password, role } = req.body;

//         // Check if user exists
//         const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
//         if (existingUser) {
//             return res.status(400).json({ error: 'User already exists with this email or employee ID' });
//         }

//         // Hash password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         // Create user
//         const user = new User({
//             name,
//             email,
//             employeeId,
//             password: hashedPassword,
//             role
//         });

//         await user.save();

//         res.status(201).json({ message: 'User registered successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Login
// app.post('/api/auth/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Find user
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }

//         // Verify password
//         const validPassword = await bcrypt.compare(password, user.password);
//         if (!validPassword) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }

//         // Update online status
//         user.isOnline = true;
//         await user.save();

//         // Create token
//         const token = jwt.sign(
//             { _id: user._id, role: user.role },
//             JWT_SECRET,
//             { expiresIn: '7d' }
//         );

//         res.json({
//             token,
//             user: {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 employeeId: user.employeeId,
//                 role: user.role
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Get users (opposite role)
// app.get('/api/users', authenticateToken, async (req, res) => {
//     try {
//         const currentUser = await User.findById(req.user._id);
//         const oppositeRole = currentUser.role === 'tester' ? 'developer' : 'tester';

//         const users = await User.find({ role: oppositeRole })
//             .select('-password')
//             .sort({ name: 1 });

//         res.json(users);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Get chat history
// app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const currentUserId = req.user._id;

//         const messages = await Message.find({
//             $or: [
//                 { senderId: currentUserId, receiverId: userId },
//                 { senderId: userId, receiverId: currentUserId }
//             ]
//         })
//             .populate('senderId', 'name email')
//             .populate('receiverId', 'name email')
//             .sort({ timestamp: 1 });

//         // Mark messages as read
//         await Message.updateMany(
//             { senderId: userId, receiverId: currentUserId, isRead: false },
//             { isRead: true }
//         );

//         res.json(messages);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Upload file
// app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: 'No file uploaded' });
//         }

//         res.json({
//             fileUrl: `/uploads/${req.file.filename}`,
//             fileName: req.file.originalname,
//             fileType: req.file.mimetype,
//             fileSize: req.file.size
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Get unread message count
// app.get('/api/messages/unread/count', authenticateToken, async (req, res) => {
//     try {
//         const count = await Message.countDocuments({
//             receiverId: req.user._id,
//             isRead: false
//         });

//         res.json({ count });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Socket.io connection handling
// const userSockets = new Map(); // Store userId -> socketId mapping

// io.on('connection', (socket) => {
//     console.log('New client connected:', socket.id);

//     // User joins
//     socket.on('user-connected', async (userId) => {
//         userSockets.set(userId, socket.id);
//         socket.userId = userId;

//         // Update user online status
//         await User.findByIdAndUpdate(userId, { isOnline: true });

//         // Notify all users about online status
//         io.emit('user-status-changed', { userId, isOnline: true });
//     });

//     // Send message
//     socket.on('send-message', async (data) => {
//         try {
//             const { senderId, receiverId, message, fileUrl, fileName, fileType, fileSize } = data;

//             // Save message to database
//             const newMessage = new Message({
//                 senderId,
//                 receiverId,
//                 message,
//                 fileUrl,
//                 fileName,
//                 fileType,
//                 fileSize
//             });

//             await newMessage.save();

//             const populatedMessage = await Message.findById(newMessage._id)
//                 .populate('senderId', 'name email')
//                 .populate('receiverId', 'name email');

//             // Send to receiver if online
//             const receiverSocketId = userSockets.get(receiverId);
//             if (receiverSocketId) {
//                 io.to(receiverSocketId).emit('receive-message', populatedMessage);
//             }

//             // Send back to sender for confirmation
//             socket.emit('message-sent', populatedMessage);

//             // Send notification to receiver
//             if (receiverSocketId) {
//                 const sender = await User.findById(senderId);
//                 io.to(receiverSocketId).emit('new-notification', {
//                     title: `New message from ${sender.name}`,
//                     body: message || 'Sent a file',
//                     senderId
//                 });
//             }
//         } catch (error) {
//             socket.emit('error', { message: error.message });
//         }
//     });

//     // Mark messages as read
//     socket.on('mark-as-read', async (data) => {
//         try {
//             const { senderId, receiverId } = data;
//             await Message.updateMany(
//                 { senderId, receiverId, isRead: false },
//                 { isRead: true }
//             );

//             // Notify sender that messages were read
//             const senderSocketId = userSockets.get(senderId);
//             if (senderSocketId) {
//                 io.to(senderSocketId).emit('messages-read', { receiverId });
//             }
//         } catch (error) {
//             console.error('Error marking messages as read:', error);
//         }
//     });

//     // Typing indicator
//     socket.on('typing', (data) => {
//         const receiverSocketId = userSockets.get(data.receiverId);
//         if (receiverSocketId) {
//             io.to(receiverSocketId).emit('user-typing', {
//                 senderId: data.senderId,
//                 isTyping: data.isTyping
//             });
//         }
//     });

//     // Disconnect
//     socket.on('disconnect', async () => {
//         if (socket.userId) {
//             userSockets.delete(socket.userId);

//             // Update user offline status
//             await User.findByIdAndUpdate(socket.userId, {
//                 isOnline: false,
//                 lastSeen: new Date()
//             });

//             // Notify all users about offline status
//             io.emit('user-status-changed', { userId: socket.userId, isOnline: false });
//         }
//         console.log('Client disconnected:', socket.id);
//     });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });









const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io setup
const socketController = require('./controllers/socketController');
socketController(io);

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});