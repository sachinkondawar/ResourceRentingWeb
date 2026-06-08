const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Get Razorpay Key ID
// @route   GET /api/payment/key
// @access  Private (User)
exports.getKey = (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
};

// @desc    Create a new Razorpay order
// @route   POST /api/payment/create-order
// @access  Private (User)
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) return res.status(500).json({ message: 'Some error occurred' });

    res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    const errorMessage = error.error?.description ? `Razorpay Error: ${error.error.description}` : (error.message || 'Error communicating with Razorpay. Please verify your Razorpay API keys in the backend .env file.');
    res.status(500).json({ message: errorMessage, error: error });
  }
};

// @desc    Verify payment signature
// @route   POST /api/payment/verify
// @access  Private (User)
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Signature verified successfully
      if (bookingId) {
        // Update the booking status if passed
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.paymentStatus = 'Paid';
          await booking.save();
        }
      }
      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
