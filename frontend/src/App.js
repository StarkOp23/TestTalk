// ! App.js

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Send, Paperclip, X, Users, Search, CheckCheck, Check, ChevronLeft, UserCog } from 'lucide-react';

const API_URL = 'http://localhost:5000';
let socket = null;

export default function ChatPortal() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [file, setFile] = useState(null);
  const [showAuthInChat, setShowAuthInChat] = useState(false);
  const [lastMessages, setLastMessages] = useState({});
  const [userConversations, setUserConversations] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      const parsedUser = JSON.parse(userData);

      // Check if admin first - redirect to admin dashboard
      if (parsedUser.isAdmin === true) {
        window.location.href = '/admin';
        return;
      }

      setUser(parsedUser);
      initializeChat(parsedUser);
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initializeChat = (userData) => {
    if (socket) {
      socket.disconnect();
    }

    socket = io(API_URL);
    socket.emit('user-connected', userData._id);

    socket.on('receive-message', (message) => {
      const senderId = message.senderId._id || message.senderId;

      // Add message to chat window if it's from the selected user
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      // Mark as read if viewing this conversation
      if (selectedUser && senderId === selectedUser._id) {
        socket.emit('mark-as-read', { senderId: senderId, receiverId: userData._id });
      } else {
        // Increment unread count only if not viewing this user's chat
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
      }

      // Update last message for conversations list
      setLastMessages(prev => ({
        ...prev,
        [senderId]: message
      }));

      showNotification(message);
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
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline } : u));
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

    fetchUsers();
    fetchUnreadCounts();
  };

  useEffect(() => {
    if (selectedUser && socket && user) {
      socket.emit('mark-as-read', {
        senderId: selectedUser._id,
        receiverId: user._id
      });
      setUnreadCounts(prev => ({
        ...prev,
        [selectedUser._id]: 0
      }));
    }
  }, [selectedUser, user]);

  const showNotification = (data) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title || `New message from ${data.senderId?.name}`, {
        body: data.body || data.message || 'New message',
        icon: '/chat-icon.png'
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (userId) => {
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

  const handleAuth = async () => {
    try {
      // Only login is allowed - registration removed
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful, user data:', data.user); // Debug log

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Check if admin - redirect to admin dashboard
        if (data.user.isAdmin === true) {
          console.log('Admin detected, redirecting to /admin'); // Debug log
          window.location.href = '/admin';
          return;
        }

        console.log('Regular user, initializing chat'); // Debug log
        setUser(data.user);
        initializeChat(data.user);
        setShowAuthInChat(false);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error); // Debug log
      alert('Error: ' + error.message);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !file) || !selectedUser || !socket) return;

    let fileData = null;
    if (file) {
      fileData = await uploadFile();
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const messageData = {
      senderId: user._id,
      receiverId: selectedUser._id,
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

  const handleTyping = () => {
    if (selectedUser && socket) {
      socket.emit('typing', { receiverId: selectedUser._id, senderId: user._id, isTyping: true });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { receiverId: selectedUser._id, senderId: user._id, isTyping: false });
      }, 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket) {
      socket.disconnect();
    }
    setUser(null);
    setChatOpen(false);
    setShowAuthInChat(false);
    setSelectedUser(null);
    setMessages([]);
    setUnreadCounts({});
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showAuthInChat) {
        handleAuth();
      } else {
        handleSendMessage();
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  // Get sorted conversations (recent first)
  const getSortedConversations = () => {
    return filteredUsers
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      {user && (
        <div className="bg-white shadow-md rounded-xl p-5 mb-4 border-l-4 border-indigo-600">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {user?.role === 'developer' ? '💼 PMO Portal' : user?.role === 'tester' ? '🧪 QPOT Portal' : '👑 Admin Portal'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition transform hover:scale-105 font-semibold shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {!chatOpen && (
        <button
          onClick={() => {
            setChatOpen(true);
            if (!user) {
              setShowAuthInChat(true);
            }
          }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition transform hover:scale-110 z-50 active:scale-95"
        >
          <MessageCircle className="w-6 h-6" />
          {user && getTotalUnreadCount() > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-bounce">
              {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
            </span>
          )}
        </button>
      )}

      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-indigo-100">
          {!user && showAuthInChat && (
            <>
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold text-lg">Login</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="hover:bg-indigo-700 p-1 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyPress={handleKeyPress}
                />

                <button
                  onClick={handleAuth}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg transition duration-200 font-semibold transform hover:scale-105 active:scale-95"
                >
                  Login
                </button>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700 text-center">
                    <UserCog className="w-5 h-5 inline text-indigo-600 mr-1" />
                    Don't have an account?
                  </p>
                  <p className="text-xs text-gray-600 text-center mt-2">
                    Contact your administrator to get registered
                  </p>
                </div>
              </div>
            </>
          )}

          {user && (
            <>
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">
                    {user ? user.name : 'Messages'}
                  </span>
                  {!selectedUser && getTotalUnreadCount() > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 ml-2">
                      {getTotalUnreadCount()}
                    </span>
                  )}
                </div>
                <button onClick={() => setChatOpen(false)} className="hover:bg-indigo-700 p-1 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {!selectedUser && (
                  <div className="flex-1 flex flex-col bg-gray-50">
                    <div className="p-3 border-b bg-white">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {getSortedConversations().map(u => (
                        <div
                          key={u._id}
                          onClick={() => {
                            setSelectedUser(u);
                            fetchMessages(u._id);
                          }}
                          className="p-3 border-b bg-white hover:bg-indigo-50 cursor-pointer transition active:bg-indigo-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {u.name[0].toUpperCase()}
                              </div>
                              {u.isOnline && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-gray-800">{u.name}</p>
                                {u.lastMessageTime && (
                                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {formatTime(u.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              <p className={`text-sm truncate ${unreadCounts[u._id] > 0 ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                {getLastMessagePreview(u._id)}
                              </p>
                            </div>
                            {unreadCounts[u._id] > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 shadow-md">
                                {unreadCounts[u._id]}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser && (
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 border-b flex items-center gap-3 bg-white hover:bg-gray-50">
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setMessages([]);
                          setTypingUsers({});
                        }}
                        className="hover:bg-gray-100 p-2 rounded-lg transition"
                      >
                        <ChevronLeft className="w-5 h-5 text-indigo-600" />
                      </button>
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {selectedUser.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">{selectedUser.name}</p>
                        <p className={`text-xs ${selectedUser.isOnline ? 'text-green-500 font-semibold' : 'text-gray-500'}`}>
                          {selectedUser.isOnline ? '🟢 Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-white to-gray-50">
                      {messages.map((msg, idx) => {
                        const isSent = msg.senderId._id === user._id;
                        return (
                          <div key={msg._id || idx} className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                            <div className={`max-w-xs ${isSent ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-md ${isSent ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                              {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                              {msg.fileUrl && (
                                <a
                                  href={`${API_URL}${msg.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-sm ${isSent ? 'text-indigo-100' : 'text-indigo-600'} underline flex items-center gap-1 mt-2 hover:opacity-80 transition`}
                                >
                                  <Paperclip className="w-4 h-4" />
                                  <span className="truncate">{msg.fileName}</span>
                                </a>
                              )}
                              <div className="flex items-center gap-1 justify-end mt-2">
                                <span className={`text-xs ${isSent ? 'text-indigo-200' : 'text-gray-400'}`}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isSent && (
                                  msg.isRead ?
                                    <CheckCheck className="w-4 h-4 text-blue-300 font-bold" /> :
                                    <Check className="w-4 h-4 text-indigo-200" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {typingUsers[selectedUser?._id] && (
                        <div className="flex justify-start animate-fadeIn">
                          <div className="bg-gray-300 rounded-2xl rounded-bl-none px-4 py-2 shadow-md">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t bg-white">
                      {file && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                          <Paperclip className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                          <button
                            onClick={() => {
                              setFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-red-500 hover:text-red-700 transition hover:scale-110"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition transform hover:scale-110 active:scale-95"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <textarea
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none max-h-20 transition"
                          rows="1"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-2 rounded-lg hover:shadow-lg transition transform hover:scale-110 active:scale-95"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}