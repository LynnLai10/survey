const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { jwtAuth } = require('../middlewares/jwtAuth');
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

// GET /api/entitlements/my-access - Get current user's entitlements
router.get('/my-access', jwtAuth, async (req, res) => {
  try {
    const user = await resolveUser(req, 'companyId');
    if (!user || !user.companyId) {
      return res.status(403).json({ error: 'Company not found' });
    }

    const { page = 1, pageSize = 20, status = 'active' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = { companyId: user.companyId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get entitlements with bank details
    const entitlements = await Entitlement.find(filter)
      .populate('bankId', 'title description questionCount')
      .sort({ grantedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Entitlement.countDocuments(filter);

    res.json({
      success: true,
      entitlements,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('Error fetching entitlements:', error);
    res.status(500).json({ error: 'Failed to fetch entitlements', details: error.message });
  }
});

module.exports = router;