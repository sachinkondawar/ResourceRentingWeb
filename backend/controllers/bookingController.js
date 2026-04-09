const Booking = require('../models/Booking');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const socketHandler = require('../socket');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (User)
exports.createBooking = async (req, res) => {
  try {
    const { itemId, startDate, endDate, totalAmount } = req.body;

    // Check item availability
    const item = await Item.findById(itemId);
    if (!item || item.status !== 'Available') {
      return res.status(400).json({ message: 'Item not available' });
    }

    const booking = new Booking({
      user: req.user.id,
      item: itemId,
      startDate,
      endDate,
      totalAmount
    });

    await booking.save();

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const notification = new Notification({
        recipient: admin._id,
        message: `New booking request for ${item.title} by ${req.user.name || 'User'}`,
        type: 'Booking',
        link: '/admin'
      });
      await notification.save();
      
      const adminSocketId = socketHandler.getSocketId(String(admin._id));
      if (adminSocketId) {
        socketHandler.getIo().to(adminSocketId).emit('notification', notification);
      }
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get logged in user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private (User)
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('item', 'title images pricePerDay');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email').populate('item', 'title pricePerDay');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private (Admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    // Optional: If status becomes Active, change item status to Rented
    if (status === 'Active') {
      await Item.findByIdAndUpdate(booking.item, { status: 'Rented' });
    } else if (status === 'Completed' || status === 'Cancelled') {
      await Item.findByIdAndUpdate(booking.item, { status: 'Available' });
    }

    await booking.save();

    // Notify user
    // Since this is admin updating, notify the user whose booking it is
    const notification = new Notification({
      recipient: booking.user,
      message: `Your booking status for item has been updated to ${booking.status}`,
      type: 'Booking',
      link: '/my-bookings'
    });
    await notification.save();

    const userSocketId = socketHandler.getSocketId(String(booking.user));
    if (userSocketId) {
      socketHandler.getIo().to(userSocketId).emit('notification', notification);
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private (Admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
