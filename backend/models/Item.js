const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  location: { type: String, required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['Available', 'Rented', 'Maintenance'], default: 'Available' },
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
