const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, config.JWT_SECRET);
        
        // Check if user is admin
        const user = await User.findById(verified._id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};