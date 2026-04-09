const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/metrics', verifyToken, isAdmin, adminController.getDashboardMetrics);
router.get('/recent-bookings', verifyToken, isAdmin, adminController.getRecentBookings);

module.exports = router;
