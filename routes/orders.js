const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { jwtAuth } = require('../middlewares/jwtAuth');
const Order = require('../models/Order');
const PublicBank = require('../models/PublicBank');
const Entitlement = require('../models/Entitlement');
const User = require('../models/User');

// Helper function to resolve user
const resolveUser = async (req, select) => {
  const raw = req.user && (req.user.id || req.user._id || req.user);
  if (!raw) return null;
  if (mongoose.Types.ObjectId.isValid(raw)) {
    return await User.findById(raw).select(select);
  }
  return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(select);
};

// GET /api/orders/history - Get purchase history for current user's company
// This must come BEFORE /:orderId to avoid route matching conflict
router.get('/history', jwtAuth, async (req, res) => {
  try {
    const user = await resolveUser(req, 'companyId');
    if (!user || !user.companyId) {
      return res.status(403).json({ error: 'Company not found' });
    }

    const { page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Get orders with bank details
    const orders = await Order.find({ companyId: user.companyId })
      .populate('bankId', 'title description questionCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Order.countDocuments({ companyId: user.companyId });

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history', details: error.message });
  }
});

// GET /api/orders/:orderId - Get specific order details
// This must come AFTER /history to avoid route matching conflict
router.get('/:orderId', jwtAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Resolve current user and verify access
    const user = await resolveUser(req, 'companyId');
    if (!user || !user.companyId) {
      return res.status(403).json({ error: 'Company not found' });
    }

    // Find order and verify it belongs to the user's company
    const order = await Order.findOne({
      _id: orderId,
      companyId: user.companyId  // Security: Only return orders for current user's company
    }).lean();

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
