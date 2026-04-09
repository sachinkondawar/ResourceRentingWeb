const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get admin contact ID for chat
// @route   GET /api/users/admin-contact
// @access  Private
exports.getAdminContact = async (req, res) => {
  try {
    const query = { role: 'admin' };

    if (req.user?.role === 'admin') {
      query._id = { $ne: req.user.id };
    }

    const adminUser = await User.findOne(query).select('_id name email role');

    if (!adminUser) {
      if (req.user?.role === 'admin') {
        return res.status(400).json({ message: 'You are already an admin. Please use the admin messages panel.' });
      }

      return res.status(404).json({ message: 'No admin available' });
    }

    res.status(200).json(adminUser);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
