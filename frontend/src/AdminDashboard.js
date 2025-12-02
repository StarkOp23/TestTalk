// // ! AdminDashboard

// import React, { useState, useEffect, useRef } from 'react';
// import { Users, Download, Trash2, UserPlus, BarChart3, MessageSquare, UserCheck, Calendar, MessageCircle, Send, Paperclip, X, Search, CheckCheck, Check, ChevronLeft, LogOut, Filter, MoreVertical } from 'lucide-react';
// import { io } from 'socket.io-client';

// const API_URL = 'http://localhost:5000';
// let socket = null;

// export default function AdminDashboard() {
//     const [stats, setStats] = useState(null);
//     const [users, setUsers] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [showRegisterModal, setShowRegisterModal] = useState(false);
//     const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);
//     const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
//     const [chatHistory, setChatHistory] = useState([]);
//     const [formData, setFormData] = useState({
//         name: '',
//         email: '',
//         employeeId: '',
//         password: '',
//         role: 'developer'
//     });

//     // Chat-related states
//     const [adminUser, setAdminUser] = useState(null);
//     const [chatOpen, setChatOpen] = useState(false);
//     const [chatUsers, setChatUsers] = useState([]);
//     const [selectedChatUser, setSelectedChatUser] = useState(null);
//     const [messages, setMessages] = useState([]);
//     const [newMessage, setNewMessage] = useState('');
//     const [searchQuery, setSearchQuery] = useState('');
//     const [typingUsers, setTypingUsers] = useState({});
//     const [unreadCounts, setUnreadCounts] = useState({});
//     const [file, setFile] = useState(null);
//     const [lastMessages, setLastMessages] = useState({});
//     const messagesEndRef = useRef(null);
//     const typingTimeoutRef = useRef(null);
//     const fileInputRef = useRef(null);

//     useEffect(() => {
//         const userData = JSON.parse(localStorage.getItem('user'));
//         setAdminUser(userData);

//         fetchStats();
//         fetchUsers();
//         fetchChatUsers();
//         initializeChat(userData);
//     }, []);

//     useEffect(() => {
//         if (messagesEndRef.current) {
//             messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
//         }
//     }, [messages]);

//     const initializeChat = (userData) => {
//         if (socket) {
//             socket.disconnect();
//         }

//         socket = io(API_URL);
//         socket.emit('user-connected', userData._id);

//         socket.on('receive-message', (message) => {
//             const senderId = message.senderId._id || message.senderId;

//             setMessages(prev => {
//                 const exists = prev.some(m => m._id === message._id);
//                 if (exists) return prev;
//                 return [...prev, message];
//             });

//             if (selectedChatUser && senderId === selectedChatUser._id) {
//                 socket.emit('mark-as-read', { senderId: senderId, receiverId: userData._id });
//             } else {
//                 setUnreadCounts(prev => ({
//                     ...prev,
//                     [senderId]: (prev[senderId] || 0) + 1
//                 }));
//             }

//             setLastMessages(prev => ({
//                 ...prev,
//                 [senderId]: message
//             }));
//         });

//         socket.on('message-sent', (message) => {
//             setMessages(prev => {
//                 const exists = prev.some(m => m._id === message._id);
//                 if (exists) return prev;
//                 return [...prev, message];
//             });

//             const receiverId = message.receiverId._id || message.receiverId;
//             setLastMessages(prev => ({
//                 ...prev,
//                 [receiverId]: message
//             }));
//         });

//         socket.on('user-typing', (data) => {
//             setTypingUsers(prev => ({
//                 ...prev,
//                 [data.senderId]: data.isTyping
//             }));
//         });

//         socket.on('user-status-changed', ({ userId, isOnline }) => {
//             setChatUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline } : u));
//         });

//         socket.on('unread-count-update', ({ senderId, count }) => {
//             setUnreadCounts(prev => ({
//                 ...prev,
//                 [senderId]: count
//             }));
//         });

//         socket.on('messages-read', ({ receiverId }) => {
//             setMessages(prev => prev.map(msg => {
//                 if (msg.receiverId._id === receiverId && msg.senderId._id === userData._id) {
//                     return { ...msg, isRead: true };
//                 }
//                 return msg;
//             }));
//         });

//         fetchUnreadCounts();
//     };

//     const fetchChatUsers = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/users`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await response.json();
//             setChatUsers(data);
//         } catch (error) {
//             console.error('Error fetching chat users:', error);
//         }
//     };

//     const fetchChatMessages = async (userId) => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/messages/${userId}`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await response.json();
//             setMessages(data);
//             setUnreadCounts(prev => ({
//                 ...prev,
//                 [userId]: 0
//             }));
//         } catch (error) {
//             console.error('Error fetching messages:', error);
//         }
//     };

//     const fetchUnreadCounts = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/messages/unread/count`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await response.json();
//             setUnreadCounts(data);
//         } catch (error) {
//             console.error('Error fetching unread counts:', error);
//         }
//     };

//     const handleSendMessage = async () => {
//         if ((!newMessage.trim() && !file) || !selectedChatUser || !socket) return;

//         let fileData = null;
//         if (file) {
//             fileData = await uploadFile();
//             setFile(null);
//             if (fileInputRef.current) fileInputRef.current.value = '';
//         }

//         const messageData = {
//             senderId: adminUser._id,
//             receiverId: selectedChatUser._id,
//             message: newMessage.trim(),
//             ...(fileData && {
//                 fileUrl: fileData.fileUrl,
//                 fileName: fileData.fileName,
//                 fileType: fileData.fileType,
//                 fileSize: fileData.fileSize
//             })
//         };

//         socket.emit('send-message', messageData);
//         setNewMessage('');
//     };

//     const uploadFile = async () => {
//         if (!file) return null;

//         const formDataObj = new FormData();
//         formDataObj.append('file', file);

//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/messages/upload`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` },
//                 body: formDataObj
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 return data;
//             }
//         } catch (error) {
//             console.error('Error uploading file:', error);
//         }
//         return null;
//     };

//     const handleTyping = () => {
//         if (selectedChatUser && socket) {
//             socket.emit('typing', { receiverId: selectedChatUser._id, senderId: adminUser._id, isTyping: true });

//             clearTimeout(typingTimeoutRef.current);
//             typingTimeoutRef.current = setTimeout(() => {
//                 socket.emit('typing', { receiverId: selectedChatUser._id, senderId: adminUser._id, isTyping: false });
//             }, 2000);
//         }
//     };

//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             handleSendMessage();
//         }
//     };

//     const getTotalUnreadCount = () => {
//         return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
//     };

//     const getSortedConversations = () => {
//         return chatUsers
//             .filter(u =>
//                 u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 u.email.toLowerCase().includes(searchQuery.toLowerCase())
//             )
//             .map(u => ({
//                 ...u,
//                 lastMessage: lastMessages[u._id],
//                 lastMessageTime: lastMessages[u._id]?.timestamp || 0
//             }))
//             .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
//     };

//     const getLastMessagePreview = (userId) => {
//         const msg = lastMessages[userId];
//         if (!msg) return 'No messages yet';
//         if (msg.fileUrl) return '📎 ' + msg.fileName;
//         return msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message;
//     };

//     const formatTime = (timestamp) => {
//         const date = new Date(timestamp);
//         const today = new Date();
//         const yesterday = new Date(today);
//         yesterday.setDate(yesterday.getDate() - 1);

//         if (date.toDateString() === today.toDateString()) {
//             return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//         } else if (date.toDateString() === yesterday.toDateString()) {
//             return 'Yesterday';
//         } else {
//             return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//         }
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         if (socket) {
//             socket.disconnect();
//         }
//         window.location.href = '/';
//     };

//     useEffect(() => {
//         fetchStats();
//         fetchUsers();
//     }, []);

//     const fetchStats = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await response.json();
//             setStats(data);
//         } catch (error) {
//             console.error('Error fetching stats:', error);
//         }
//     };

//     const fetchUsers = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/admin/users`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await response.json();
//             setUsers(data);
//         } catch (error) {
//             console.error('Error fetching users:', error);
//         }
//     };

//     const handleRegisterUser = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/admin/users/register`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(formData)
//             });

//             const data = await response.json();

//             if (response.ok) {
//                 alert('User registered successfully!');
//                 setShowRegisterModal(false);
//                 setFormData({
//                     name: '',
//                     email: '',
//                     employeeId: '',
//                     password: '',
//                     role: 'developer'
//                 });
//                 fetchUsers();
//                 fetchStats();
//             } else {
//                 alert(data.error || 'Registration failed');
//             }
//         } catch (error) {
//             alert('Error: ' + error.message);
//         }
//     };

//     const handleDeleteUser = async (userId, userName) => {
//         if (!window.confirm(`Are you sure you want to delete ${userName}? This will also delete all their messages.`)) {
//             return;
//         }

//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
//                 method: 'DELETE',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             const data = await response.json();

//             if (response.ok) {
//                 alert('User deleted successfully!');
//                 fetchUsers();
//                 fetchStats();
//             } else {
//                 alert(data.error || 'Delete failed');
//             }
//         } catch (error) {
//             alert('Error: ' + error.message);
//         }
//     };

//     const handleViewChatHistory = async (user) => {
//         setSelectedUser(user);
//         setShowChatHistoryModal(true);
//         setDateRange({ startDate: '', endDate: '' });
//         await fetchChatHistory(user._id);
//     };

//     const fetchChatHistory = async (userId, start = '', end = '') => {
//         try {
//             const token = localStorage.getItem('token');
//             const params = new URLSearchParams();
//             if (start) params.append('startDate', start);
//             if (end) params.append('endDate', end);

//             const response = await fetch(
//                 `${API_URL}/api/admin/users/${userId}/chat-history?${params}`,
//                 { headers: { 'Authorization': `Bearer ${token}` } }
//             );
//             const data = await response.json();
//             setChatHistory(data);
//         } catch (error) {
//             console.error('Error fetching chat history:', error);
//         }
//     };

//     const handleDownloadChatHistory = async () => {
//         if (!selectedUser) return;

//         try {
//             const token = localStorage.getItem('token');
//             const params = new URLSearchParams();
//             if (dateRange.startDate) params.append('startDate', dateRange.startDate);
//             if (dateRange.endDate) params.append('endDate', dateRange.endDate);

//             const response = await fetch(
//                 `${API_URL}/api/admin/users/${selectedUser._id}/download-chat?${params}`,
//                 { headers: { 'Authorization': `Bearer ${token}` } }
//             );

//             const blob = await response.blob();
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = `chat_history_${selectedUser.name}_${Date.now()}.csv`;
//             document.body.appendChild(a);
//             a.click();
//             window.URL.revokeObjectURL(url);
//             document.body.removeChild(a);
//         } catch (error) {
//             alert('Error downloading chat history: ' + error.message);
//         }
//     };

//     const applyDateFilter = () => {
//         if (selectedUser) {
//             fetchChatHistory(selectedUser._id, dateRange.startDate, dateRange.endDate);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-50">
//             {/* Header */}
//             <header className="bg-white shadow-sm border-b border-gray-200">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                     <div className="flex justify-between items-center h-16">
//                         <div className="flex items-center space-x-3">
//                             <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
//                                 <MessageCircle className="w-5 h-5 text-white" />
//                             </div>
//                             <div>
//                                 <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
//                                 <p className="text-sm text-gray-500">Chat Portal Management</p>
//                             </div>
//                         </div>

//                         <div className="flex items-center space-x-4">
//                             <button
//                                 onClick={handleLogout}
//                                 className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
//                             >
//                                 <LogOut className="w-4 h-4" />
//                                 <span>Logout</span>
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </header>

//             {/* Main Content */}
//             <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//                 {/* Stats Grid */}
//                 {stats && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <p className="text-sm font-medium text-gray-600">Total Users</p>
//                                     <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
//                                     <p className="text-xs text-gray-500 mt-1">Active chat users</p>
//                                 </div>
//                                 <div className="p-3 bg-blue-50 rounded-lg">
//                                     <Users className="w-6 h-6 text-blue-600" />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <p className="text-sm font-medium text-gray-600">Developers</p>
//                                     <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDevelopers}</p>
//                                     <p className="text-xs text-gray-500 mt-1">Development team</p>
//                                 </div>
//                                 <div className="p-3 bg-green-50 rounded-lg">
//                                     <BarChart3 className="w-6 h-6 text-green-600" />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <p className="text-sm font-medium text-gray-600">Testers</p>
//                                     <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTesters}</p>
//                                     <p className="text-xs text-gray-500 mt-1">QA team</p>
//                                 </div>
//                                 <div className="p-3 bg-purple-50 rounded-lg">
//                                     <UserCheck className="w-6 h-6 text-purple-600" />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <p className="text-sm font-medium text-gray-600">Messages</p>
//                                     <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMessages}</p>
//                                     <p className="text-xs text-gray-500 mt-1">Total exchanged</p>
//                                 </div>
//                                 <div className="p-3 bg-orange-50 rounded-lg">
//                                     <MessageSquare className="w-6 h-6 text-orange-600" />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Users Table Section */}
//                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                     <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                         <div>
//                             <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
//                             <p className="text-sm text-gray-600 mt-1">Manage all developers and testers</p>
//                         </div>
//                         <button
//                             onClick={() => setShowRegisterModal(true)}
//                             className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
//                         >
//                             <UserPlus className="w-4 h-4" />
//                             <span>Add User</span>
//                         </button>
//                     </div>

//                     <div className="overflow-x-auto">
//                         <table className="w-full">
//                             <thead className="bg-gray-50">
//                                 <tr>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="bg-white divide-y divide-gray-200">
//                                 {users.map(user => (
//                                     <tr key={user._id} className="hover:bg-gray-50 transition-colors">
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <div className="flex items-center">
//                                                 <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
//                                                     {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
//                                                 </div>
//                                                 <div className="ml-4">
//                                                     <div className="text-sm font-medium text-gray-900">{user.name}</div>
//                                                     <div className="text-sm text-gray-500">{user.email}</div>
//                                                 </div>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.employeeId}</td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'developer'
//                                                     ? 'bg-blue-100 text-blue-800'
//                                                     : 'bg-green-100 text-green-800'
//                                                 }`}>
//                                                 {user.role}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <div className="flex items-center">
//                                                 <div className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-400' : 'bg-gray-300'
//                                                     }`}></div>
//                                                 <span className="text-sm text-gray-600">
//                                                     {user.isOnline ? 'Online' : 'Offline'}
//                                                 </span>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                                             <div className="flex items-center space-x-2">
//                                                 <button
//                                                     onClick={() => handleViewChatHistory(user)}
//                                                     className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
//                                                     title="Download Chat History"
//                                                 >
//                                                     <Download className="w-4 h-4" />
//                                                 </button>
//                                                 <button
//                                                     onClick={() => handleDeleteUser(user._id, user.name)}
//                                                     className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
//                                                     title="Delete User"
//                                                 >
//                                                     <Trash2 className="w-4 h-4" />
//                                                 </button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             </main>

//             {/* Register User Modal */}
//             {showRegisterModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
//                         <div className="px-6 py-4 border-b border-gray-200">
//                             <h3 className="text-lg font-semibold text-gray-900">Register New User</h3>
//                             <p className="text-sm text-gray-600 mt-1">Add a new developer or tester</p>
//                         </div>

//                         <div className="px-6 py-4 space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
//                                 <input
//                                     type="text"
//                                     placeholder="Enter full name"
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
//                                     value={formData.name}
//                                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                                 <input
//                                     type="email"
//                                     placeholder="Enter email address"
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
//                                     value={formData.email}
//                                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
//                                 <input
//                                     type="text"
//                                     placeholder="Enter employee ID"
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
//                                     value={formData.employeeId}
//                                     onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
//                                 <input
//                                     type="password"
//                                     placeholder="Enter password"
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
//                                     value={formData.password}
//                                     onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//                                 <select
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
//                                     value={formData.role}
//                                     onChange={(e) => setFormData({ ...formData, role: e.target.value })}
//                                 >
//                                     <option value="developer">Developer</option>
//                                     <option value="tester">Tester</option>
//                                 </select>
//                             </div>
//                         </div>

//                         <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
//                             <button
//                                 onClick={() => setShowRegisterModal(false)}
//                                 className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={handleRegisterUser}
//                                 className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
//                             >
//                                 Create User
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Chat History Modal */}
//             {showChatHistoryModal && selectedUser && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
//                         <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
//                             <div>
//                                 <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
//                                 <p className="text-sm text-gray-600 mt-1">Conversations with {selectedUser.name}</p>
//                             </div>
//                             <button
//                                 onClick={() => {
//                                     setShowChatHistoryModal(false);
//                                     setSelectedUser(null);
//                                     setChatHistory([]);
//                                 }}
//                                 className="text-gray-400 hover:text-gray-600 transition-colors"
//                             >
//                                 <X className="w-5 h-5" />
//                             </button>
//                         </div>

//                         {/* Filters */}
//                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
//                             <div className="flex flex-wrap gap-4 items-end">
//                                 <div className="flex-1 min-w-[200px]">
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
//                                     <input
//                                         type="date"
//                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
//                                         value={dateRange.startDate}
//                                         onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
//                                     />
//                                 </div>
//                                 <div className="flex-1 min-w-[200px]">
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
//                                     <input
//                                         type="date"
//                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
//                                         value={dateRange.endDate}
//                                         onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
//                                     />
//                                 </div>
//                                 <button
//                                     onClick={applyDateFilter}
//                                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center space-x-2"
//                                 >
//                                     <Filter className="w-4 h-4" />
//                                     <span>Apply Filter</span>
//                                 </button>
//                                 <button
//                                     onClick={handleDownloadChatHistory}
//                                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center space-x-2"
//                                 >
//                                     <Download className="w-4 h-4" />
//                                     <span>Export CSV</span>
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Messages */}
//                         <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
//                             {chatHistory.length === 0 ? (
//                                 <div className="text-center py-12">
//                                     <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//                                     <p className="text-gray-500 text-lg">No messages found</p>
//                                     <p className="text-gray-400 text-sm mt-1">Try adjusting your date filters</p>
//                                 </div>
//                             ) : (
//                                 <div className="space-y-4">
//                                     {chatHistory.map((msg, idx) => (
//                                         <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
//                                             <div className="flex items-start justify-between mb-3">
//                                                 <div className="flex items-center space-x-3">
//                                                     <div className="flex items-center space-x-2">
//                                                         <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
//                                                             {msg.senderId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
//                                                         </div>
//                                                         <span className="text-sm font-medium text-gray-900">{msg.senderId.name}</span>
//                                                     </div>
//                                                     <span className="text-gray-300">→</span>
//                                                     <div className="flex items-center space-x-2">
//                                                         <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
//                                                             {msg.receiverId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
//                                                         </div>
//                                                         <span className="text-sm font-medium text-gray-900">{msg.receiverId.name}</span>
//                                                     </div>
//                                                 </div>
//                                                 <div className="flex items-center space-x-2">
//                                                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${msg.isRead ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
//                                                         }`}>
//                                                         {msg.isRead ? 'Read' : 'Unread'}
//                                                     </span>
//                                                     <span className="text-xs text-gray-500">
//                                                         {new Date(msg.timestamp).toLocaleString()}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                             <p className="text-gray-700 mb-2">{msg.message || '[File Attachment]'}</p>
//                                             {msg.fileName && (
//                                                 <div className="flex items-center space-x-2 text-sm text-blue-600">
//                                                     <Paperclip className="w-4 h-4" />
//                                                     <span>{msg.fileName}</span>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }



// ! AdminDashboard 

import React, { useState, useEffect, useRef } from 'react';
import { Users, Download, Trash2, UserPlus, BarChart3, MessageSquare, UserCheck, Calendar, MessageCircle, Send, Paperclip, X, Search, CheckCheck, Check, ChevronLeft, LogOut, Filter, Home } from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000';
let socket = null;

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [chatHistory, setChatHistory] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        employeeId: '',
        password: '',
        role: 'developer'
    });

    // Chat-related states
    const [adminUser, setAdminUser] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatUsers, setChatUsers] = useState([]);
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [typingUsers, setTypingUsers] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});
    const [file, setFile] = useState(null);
    const [lastMessages, setLastMessages] = useState({});
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Fix online status tracking
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        setAdminUser(userData);

        // Initialize in the correct order
        const init = async () => {
            await fetchUsers();
            await fetchChatUsers();
            await fetchOnlineUsers(); // Fetch online users immediately
            initializeChat(userData);
            await fetchStats();
        };

        init();

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        // Filter users based on search query
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [users, searchQuery]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchOnlineUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/online-users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            // Update online users set
            const onlineSet = new Set(data.onlineUsers || []);
            setOnlineUsers(onlineSet);

            // Update users status
            setUsers(prev => prev.map(user => ({
                ...user,
                isOnline: onlineSet.has(user._id)
            })));
        } catch (error) {
            console.error('Error fetching online users:', error);
        }
    };

    const initializeChat = (userData) => {
        if (socket) {
            socket.disconnect();
        }

        socket = io(API_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            console.log('Socket connected as admin:', userData._id);
            setIsSocketConnected(true);

            // Emit admin connection with current user data
            socket.emit('admin-connected', {
                userId: userData._id,
                name: userData.name,
                role: 'admin'
            });

            // Fetch current online users after connection
            fetchOnlineUsers();
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsSocketConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsSocketConnected(false);
        });

        socket.on('reconnect', () => {
            console.log('Socket reconnected');
            setIsSocketConnected(true);
            fetchOnlineUsers();
        });

        // Listen for current online users list when admin connects
        socket.on('current-online-users', (userIds) => {
            console.log('Received current online users:', userIds);
            const onlineSet = new Set(userIds || []);
            setOnlineUsers(onlineSet);

            // Update users status
            setUsers(prev => prev.map(user => ({
                ...user,
                isOnline: onlineSet.has(user._id)
            })));
        });

        socket.on('user-connected', (userId) => {
            console.log('User connected:', userId);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });

            // Update users status
            setUsers(prev => prev.map(user =>
                user._id === userId ? { ...user, isOnline: true } : user
            ));
        });

        socket.on('user-disconnected', (userId) => {
            console.log('User disconnected:', userId);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });

            // Update users status
            setUsers(prev => prev.map(user =>
                user._id === userId ? { ...user, isOnline: false } : user
            ));
        });

        socket.on('receive-message', (message) => {
            const senderId = message.senderId._id || message.senderId;

            setMessages(prev => {
                const exists = prev.some(m => m._id === message._id);
                if (exists) return prev;
                return [...prev, message];
            });

            if (selectedChatUser && senderId === selectedChatUser._id) {
                socket.emit('mark-as-read', { senderId: senderId, receiverId: userData._id });
            } else {
                setUnreadCounts(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }));
            }

            setLastMessages(prev => ({
                ...prev,
                [senderId]: message
            }));
        });

        socket.on('message-sent', (message) => {
            setMessages(prev => {
                const exists = prev.some(m => m._id === message._id);
                if (exists) return prev;
                return [...prev, message];
            });

            const receiverId = message.receiverId._id || message.receiverId;
            setLastMessages(prev => ({
                ...prev,
                [receiverId]: message
            }));
        });

        socket.on('user-typing', (data) => {
            setTypingUsers(prev => ({
                ...prev,
                [data.senderId]: data.isTyping
            }));
        });

        socket.on('user-status-changed', ({ userId, isOnline }) => {
            console.log('User status changed:', userId, isOnline);
            if (isOnline) {
                setOnlineUsers(prev => new Set(prev).add(userId));
            } else {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            }

            // Update both users arrays
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline } : u));
            setChatUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline } : u));
        });

        socket.on('unread-count-update', ({ senderId, count }) => {
            setUnreadCounts(prev => ({
                ...prev,
                [senderId]: count
            }));
        });

        socket.on('messages-read', ({ receiverId }) => {
            setMessages(prev => prev.map(msg => {
                if (msg.receiverId._id === receiverId && msg.senderId._id === userData._id) {
                    return { ...msg, isRead: true };
                }
                return msg;
            }));
        });

        fetchUnreadCounts();
    };

    const fetchChatUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setChatUsers(data);
        } catch (error) {
            console.error('Error fetching chat users:', error);
        }
    };

    const fetchChatMessages = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setMessages(data);
            setUnreadCounts(prev => ({
                ...prev,
                [userId]: 0
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchUnreadCounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/unread/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setUnreadCounts(data);
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !file) || !selectedChatUser || !socket) return;

        let fileData = null;
        if (file) {
            fileData = await uploadFile();
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }

        const messageData = {
            senderId: adminUser._id,
            receiverId: selectedChatUser._id,
            message: newMessage.trim(),
            ...(fileData && {
                fileUrl: fileData.fileUrl,
                fileName: fileData.fileName,
                fileType: fileData.fileType,
                fileSize: fileData.fileSize
            })
        };

        socket.emit('send-message', messageData);
        setNewMessage('');
    };

    const uploadFile = async () => {
        if (!file) return null;

        const formDataObj = new FormData();
        formDataObj.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataObj
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
        return null;
    };

    const handleTyping = () => {
        if (selectedChatUser && socket) {
            socket.emit('typing', { receiverId: selectedChatUser._id, senderId: adminUser._id, isTyping: true });

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing', { receiverId: selectedChatUser._id, senderId: adminUser._id, isTyping: false });
            }, 2000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getTotalUnreadCount = () => {
        return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    };

    const getSortedConversations = () => {
        return chatUsers
            .filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(u => ({
                ...u,
                lastMessage: lastMessages[u._id],
                lastMessageTime: lastMessages[u._id]?.timestamp || 0
            }))
            .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    };

    const getLastMessagePreview = (userId) => {
        const msg = lastMessages[userId];
        if (!msg) return 'No messages yet';
        if (msg.fileUrl) return '📎 ' + msg.fileName;
        return msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message;
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (socket) {
            socket.disconnect();
        }
        window.location.href = '/';
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleRegisterUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/users/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('User registered successfully!');
                setShowRegisterModal(false);
                setFormData({
                    name: '',
                    email: '',
                    employeeId: '',
                    password: '',
                    role: 'developer'
                });
                fetchUsers();
                fetchStats();
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}? This will also delete all their messages.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                alert('User deleted successfully!');
                fetchUsers();
                fetchStats();
            } else {
                alert(data.error || 'Delete failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleViewChatHistory = async (user) => {
        setSelectedUser(user);
        setShowChatHistoryModal(true);
        setDateRange({ startDate: '', endDate: '' });
        await fetchChatHistory(user._id);
    };

    const fetchChatHistory = async (userId, start = '', end = '') => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);

            const response = await fetch(
                `${API_URL}/api/admin/users/${userId}/chat-history?${params}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            setChatHistory(data);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const handleDownloadChatHistory = async () => {
        if (!selectedUser) return;

        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await fetch(
                `${API_URL}/api/admin/users/${selectedUser._id}/download-chat?${params}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat_history_${selectedUser.name}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Error downloading chat history: ' + error.message);
        }
    };

    const applyDateFilter = () => {
        if (selectedUser) {
            fetchChatHistory(selectedUser._id, dateRange.startDate, dateRange.endDate);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Sidebar */}
            <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} z-40 shadow-2xl`}>
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <h1 className="text-xl font-bold">ChatPortal</h1>
                                <p className="text-xs text-gray-400">Admin Panel</p>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-500/20 text-blue-300 border-l-4 border-blue-500' : 'hover:bg-gray-700/50 text-gray-300'}`}
                    >
                        <Home className="w-5 h-5" />
                        {!sidebarCollapsed && <span>Dashboard</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'users' ? 'bg-blue-500/20 text-blue-300 border-l-4 border-blue-500' : 'hover:bg-gray-700/50 text-gray-300'}`}
                    >
                        <Users className="w-5 h-5" />
                        {!sidebarCollapsed && <span>All Users</span>}
                    </button>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
                    <div className="mb-4 px-3 py-2 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-xs text-gray-300">
                                {isSocketConnected ? 'Connected' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg"
                    >
                        <LogOut className="w-5 h-5" />
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Header */}
                <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-8 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {activeTab === 'dashboard' ? 'Admin Dashboard' : 'User Management'}
                                    </h1>
                                    <p className="text-sm text-gray-500">Welcome back, {adminUser?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{adminUser?.name}</p>
                                        <p className="text-xs text-gray-500">Administrator</p>
                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                        {adminUser?.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-8">
                    {/* Stats Grid - Enhanced */}
                    {stats && activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                                        <div className="flex items-center mt-2">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${onlineUsers.size > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                            <span className="text-xs font-medium text-green-600">
                                                {onlineUsers.size} online
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl">
                                        <Users className="w-8 h-8 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Developers</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDevelopers}</p>
                                        <div className="flex items-center mt-2">
                                            <div className={`w-3 h-3 rounded-full mr-2 bg-blue-500`}></div>
                                            <span className="text-xs font-medium text-blue-600">Development team</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl">
                                        <BarChart3 className="w-8 h-8 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Testers</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTesters}</p>
                                        <div className="flex items-center mt-2">
                                            <div className={`w-3 h-3 rounded-full mr-2 bg-purple-500`}></div>
                                            <span className="text-xs font-medium text-purple-600">QA team</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl">
                                        <UserCheck className="w-8 h-8 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Messages</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMessages}</p>
                                        <div className="flex items-center mt-2">
                                            <MessageSquare className="w-4 h-4 text-orange-500 mr-1" />
                                            <span className="text-xs font-medium text-orange-600">Total exchanged</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl">
                                        <MessageSquare className="w-8 h-8 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Table Section */}
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-50 to-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                                <div className="flex items-center space-x-3 mt-1">
                                    <p className="text-sm text-gray-600">
                                        Showing {filteredUsers.length} of {users.length} users
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-xs text-gray-500">{onlineUsers.size} online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, ID or role..."
                                        className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 w-64"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setShowRegisterModal(true)}
                                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    <span>Add New User</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User Details</th>
                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee ID</th>
                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Users className="w-12 h-12 text-gray-300 mb-4" />
                                                    <p className="text-gray-500 text-lg font-medium">No users found</p>
                                                    <p className="text-gray-400 text-sm mt-2">
                                                        {searchQuery ? `No results for "${searchQuery}"` : 'No users in the system yet'}
                                                    </p>
                                                    {searchQuery && (
                                                        <button
                                                            onClick={() => setSearchQuery('')}
                                                            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Clear search
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user._id} className="hover:bg-gray-50/80 transition-all duration-150">
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                            </div>
                                                            {/* Online status indicator */}
                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${onlineUsers.has(user._id) ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg inline-block">
                                                        {user.employeeId}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${user.role === 'developer'
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                        : 'bg-green-100 text-green-800 border border-green-200'
                                                        }`}>
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`w-3 h-3 rounded-full mr-2 ${onlineUsers.has(user._id) ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                                                            }`}></div>
                                                        <span className={`text-sm font-medium ${onlineUsers.has(user._id) ? 'text-green-600' : 'text-gray-500'
                                                            }`}>
                                                            {onlineUsers.has(user._id) ? 'Online' : 'Offline'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewChatHistory(user)}
                                                            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 text-sm font-medium rounded-lg transition-all duration-200"
                                                            title="View Chat History"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            <span>History</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user._id, user.name)}
                                                            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 text-sm font-medium rounded-lg transition-all duration-200"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Register User Modal - Enhanced */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <h3 className="text-xl font-bold text-gray-900">Register New User</h3>
                            <p className="text-sm text-gray-600 mt-1">Add a new member to the team</p>
                        </div>

                        <div className="px-8 py-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                                <input
                                    type="text"
                                    placeholder="Enter employee ID"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="developer">Developer</option>
                                    <option value="tester">Tester</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex space-x-4">
                            <button
                                onClick={() => setShowRegisterModal(false)}
                                className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegisterUser}
                                className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 shadow-lg"
                            >
                                Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat History Modal - Enhanced */}
            {showChatHistoryModal && selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Chat History</h3>
                                    <p className="text-sm text-gray-600 mt-1">Conversations with {selectedUser.name} ({selectedUser.email})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowChatHistoryModal(false);
                                    setSelectedUser(null);
                                    setChatHistory([]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white"
                                            value={dateRange.startDate}
                                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white"
                                            value={dateRange.endDate}
                                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={applyDateFilter}
                                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
                                >
                                    <Filter className="w-5 h-5" />
                                    <span>Apply Filter</span>
                                </button>
                                <button
                                    onClick={handleDownloadChatHistory}
                                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>Export CSV</span>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-gray-50/50 to-white">
                            {chatHistory.length === 0 ? (
                                <div className="text-center py-16">
                                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg font-medium">No messages found</p>
                                    <p className="text-gray-400 text-sm mt-2">Try adjusting your date filters or select a different user</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                            {msg.senderId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-gray-900">{msg.senderId.name}</span>
                                                            <p className="text-xs text-gray-500">Sender</p>
                                                        </div>
                                                    </div>
                                                    <ChevronLeft className="w-5 h-5 text-gray-300 transform rotate-180" />
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                            {msg.receiverId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-gray-900">{msg.receiverId.name}</span>
                                                            <p className="text-xs text-gray-500">Receiver</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${msg.isRead ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                        }`}>
                                                        {msg.isRead ? '✓ Read' : 'Unread'}
                                                    </span>
                                                    <span className="text-sm text-gray-500 font-medium">
                                                        {new Date(msg.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 mb-3 p-3 bg-gray-50 rounded-lg">{msg.message || '[File Attachment]'}</p>
                                            {msg.fileName && (
                                                <div className="flex items-center space-x-3 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                                                    <Paperclip className="w-4 h-4" />
                                                    <span className="font-medium">{msg.fileName}</span>
                                                    <span className="text-xs text-gray-500">({msg.fileSize})</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}