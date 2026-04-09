const Item = require('../models/Item');

// @desc    Get all items (with optional filters)
// @route   GET /api/items
// @access  Public
exports.getItems = async (req, res) => {
  try {
    const { category, search, location, status } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (status && status !== 'all') query.status = status;

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Admin Private
exports.createItem = async (req, res) => {
  try {
    const { title, description, category, pricePerDay, location, images } = req.body;
    
    const item = new Item({
      title,
      description,
      category,
      pricePerDay,
      location,
      images: images || [],
    });

    const createdItem = await item.save();
    res.status(201).json(createdItem);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Admin Private
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Admin Private
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Item deleted safely' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
