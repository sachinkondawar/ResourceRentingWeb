const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private Admin
router.post('/', verifyToken, isAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary Upload Error:', err);
      return res.status(500).json({ message: 'Image upload failed', error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Cloudinary returns the exact secure URL through req.file.path from multer-storage-cloudinary
    res.status(200).json({ url: req.file.path });
  });
});

module.exports = router;
