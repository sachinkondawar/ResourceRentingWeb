const User = require('../models/User');
const Item = require('../models/Item');
const Booking = require('../models/Booking');

// @desc    Get dashboard metrics for Admin Overview
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getDashboardMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalItems = await Item.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: { $in: ['Active', 'Pending'] } });
    
    // Calculate total revenue from completed/paid bookings
    const revenueAggregation = await Booking.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    res.status(200).json({
      totalUsers,
      totalItems,
      activeBookings,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching metrics', error: error.message });
  }
};

// @desc    Get recent 5 bookings for dash
// @route   GET /api/admin/recent-bookings
// @access  Private (Admin)
exports.getRecentBookings = async (req, res) => {
  try {
    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .limit(5);
    res.status(200).json(recentBookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching recent bookings', error: error.message });
  }
};
