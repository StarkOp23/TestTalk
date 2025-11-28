//! authMiddleware

const jwt = require('jsonwebtoken');
const config = require('../config/config');

// const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, config.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};