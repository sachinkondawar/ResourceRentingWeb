const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function promote() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');
    const email = 'testuser@example.com';
    const user = await User.findOne({ email: email });
    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('User promoted');
    } else {
      console.log('User NOT found');
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
promote();
