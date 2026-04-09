const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Add a review for a completed booking
// @route   POST /api/reviews
// @access  Private (User)
exports.addReview = async (req, res) => {
  try {
    const { itemId, bookingId, rating, comment } = req.body;

    // Verify booking belongs to user and is Completed before they can review
    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id });
    if (!booking || booking.status !== 'Completed') {
      return res.status(400).json({ message: 'Valid completed booking required to review' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    const review = new Review({
      user: req.user.id,
      item: itemId,
      booking: bookingId,
      rating: Number(rating),
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server Error adding review', error: error.message });
  }
};

// @desc    Get reviews for a specific item
// @route   GET /api/reviews/item/:itemId
// @access  Public
exports.getItemReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ item: req.params.itemId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Calculate generic stats locally
    const count = reviews.length;
    let avgRating = 0;
    if (count > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      avgRating = sum / count;
    }

    res.status(200).json({ reviews, count, avgRating: avgRating.toFixed(1) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching reviews', error: error.message });
  }
};
