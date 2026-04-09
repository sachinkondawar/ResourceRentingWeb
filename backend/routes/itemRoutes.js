const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);

// Admin only routes
router.post('/', verifyToken, isAdmin, itemController.createItem);
router.put('/:id', verifyToken, isAdmin, itemController.updateItem);
router.delete('/:id', verifyToken, isAdmin, itemController.deleteItem);

module.exports = router;
