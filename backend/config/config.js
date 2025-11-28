module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-12345',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatportal',
    PORT: process.env.PORT || 5000
};