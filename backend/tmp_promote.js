const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function promote() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // Normalize and find user
    const email = 'testuser@example.com'.toLowerCase().trim();
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log('User promoted to admin!');
    } else {
      console.log('User not found. Creating a new admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const newUser = new User({
        name: 'Admin User',
        email: 'admin@rentify.com',
        password: hashedPassword,
        phone: '9876543210',
        role: 'admin'
      });
      await newUser.save();
      console.log('New admin user created: admin@rentify.com');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

promote();
