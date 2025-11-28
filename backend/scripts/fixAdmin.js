const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

async function fixAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Find all users with role 'admin' or check by email
    console.log('🔍 Searching for admin users...\n');
    
    const adminUsers = await User.find({ 
      $or: [
        { role: 'admin' },
        { email: { $regex: /admin/i } }
      ]
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      console.log('📝 Available users in database:');
      const allUsers = await User.find({}).select('name email role isAdmin');
      console.table(allUsers.map(u => ({
        Name: u.name,
        Email: u.email,
        Role: u.role,
        IsAdmin: u.isAdmin || false
      })));
      console.log('\nRun createAdmin.js to create a new admin user\n');
      process.exit(1);
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);

    for (const admin of adminUsers) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Admin User Data:');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('isAdmin:', admin.isAdmin);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Check if admin needs fixing
      if (admin.isAdmin === true && admin.role === 'admin') {
        console.log('✅ This admin user is already correctly configured!\n');
        continue;
      }

      // Fix admin user
      console.log('🔧 Fixing admin user...\n');
      
      admin.isAdmin = true;
      admin.role = 'admin';
      await admin.save();

      console.log('✅ Admin user fixed successfully!\n');
      console.log('📋 Updated Admin User Data:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('isAdmin:', admin.isAdmin);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log('🎉 All admin users are now properly configured!\n');
    console.log('You can now login with any of the above admin accounts\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdmin();