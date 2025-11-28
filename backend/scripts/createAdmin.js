const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/config');

mongoose.connect(config.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
});

async function createAdmin() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin@123', salt); // Change this password!

        const admin = new User({
            name: 'Admin',
            email: 'admin@omfysgroup.com',
            employeeId: 'ADMIN001',
            password: hashedPassword,
            role: 'admin',
            isAdmin: true
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@omfysgroup.com');
        console.log('Password: admin@123');
        console.log('⚠️  IMPORTANT: Change the password after first login!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin();