const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// User Routes
router.post('/', verifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getUserBookings);

// Admin Routes
router.get('/', verifyToken, isAdmin, bookingController.getAllBookings);
router.put('/:id', verifyToken, isAdmin, bookingController.updateBookingStatus);
router.put('/:id/payment', verifyToken, isAdmin, bookingController.updatePaymentStatus);

module.exports = router;
