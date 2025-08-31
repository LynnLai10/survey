const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { jwtAuth } = require('../middlewares/jwtAuth');
const Order = require('../models/Order');
const PublicBank = require('../models/PublicBank');

router.get('/:orderId', jwtAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const bank = await PublicBank.findById(order.bankId)
      .select('title description priceOneTime type tags questionCount')
      .lean();
    res.json({ order, bank });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

module.exports = router;
