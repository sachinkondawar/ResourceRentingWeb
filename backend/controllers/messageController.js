const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const socketHandler = require('../socket');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;
    const trimmedText = text?.trim();

    if (!receiver || !trimmedText) {
      return res.status(400).json({ message: 'Receiver and text are required' });
    }

    if (String(receiver) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    const receiverUser = await User.findById(receiver).select('_id role');
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = new Message({
      sender: req.user.id,
      receiver,
      text: trimmedText
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    // Socket Emit to receiver
    const receiverSocketId = socketHandler.getSocketId(String(receiver));
    if (receiverSocketId) {
      socketHandler.getIo().to(receiverSocketId).emit('receive_message', populatedMessage);
    } else {
      // Receiver offline, save a notification
      const link = receiverUser.role === 'admin' ? '/admin/messages' : '/chat';
      const notification = new Notification({
        recipient: receiver,
        message: `New message from ${req.user.name || 'someone'}: ${trimmedText.substring(0, 20)}...`,
        type: 'Message',
        link
      });
      await notification.save();
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user's messages
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
