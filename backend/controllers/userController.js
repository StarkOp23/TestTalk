//! userController

const User = require('../models/User');

// Get users (opposite role OR all users if admin)
exports.getUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    // If admin, return all users (developers and testers, but not other admins)
    if (currentUser.isAdmin) {
      const users = await User.find({
        isAdmin: { $ne: true },  // Exclude other admins
        _id: { $ne: currentUser._id }  // Exclude self
      })
        .select('-password')
        .sort({ name: 1 });

      return res.json(users);
    }

    // For regular users, return opposite role only
    const oppositeRole = currentUser.role === 'tester' ? 'developer' : 'tester';

    const users = await User.find({ role: oppositeRole })
      .select('-password')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};