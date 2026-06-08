const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const http = require('http');
const socketHandler = require('./socket');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://resource-renting-web.vercel.app',
  'https://resource-renting-web.vercel.app/',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes); // Added
app.use('/api/reviews', reviewRoutes); // Added
app.use('/api/notifications', notificationRoutes); // Added Notification route
app.use('/api/payment', paymentRoutes); // Added Payment route

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connection established successfully'))
.catch(err => console.error('MongoDB connection failed:', err.message));

const server = http.createServer(app);
socketHandler.init(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
