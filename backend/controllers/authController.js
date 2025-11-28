const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, employeeId, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email or employee ID'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      employeeId,
      password: hashedPassword,
      role
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    user.isOnline = true;
    await user.save();

    const token = jwt.sign(
      { _id: user._id, role: user.role, isAdmin: user.isAdmin || false },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Debug log
    console.log('User logging in:', {
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin
    });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        isAdmin: user.isAdmin || false  // Always include isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};