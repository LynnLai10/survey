const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { jwtAuth } = require('../middlewares/jwtAuth');
const PublicBank = require('../models/PublicBank');
const Order = require('../models/Order');
const User = require('../models/User');
const FreeBankAccessLog = require('../models/FreeBankAccessLog');
const { grantFreeAccess } = require('../services/companyQuestionBankService');

router.post('/free', jwtAuth, async (req, res) => {
	try {
		const { bankId } = req.body;
		if (!bankId) {
			return res.status(400).json({ error: 'bankId is required' });
		}

		const bank = await PublicBank.findOne({ _id: bankId, isActive: true });
		if (!bank || bank.type !== 'free') {
			return res.status(400).json({ error: 'Bank is not free' });
		}

		const resolveUser = async req => {
			const raw = req.user && (req.user.id || req.user._id || req.user);
			if (!raw) return null;
			if (mongoose.Types.ObjectId.isValid(raw)) {
				return await User.findById(raw).select('_id companyId');
			}
			return await User.findOne({ $or: [{ email: raw }, { username: raw }] }).select(
				'_id companyId'
			);
		};

		const user = await resolveUser(req);
		if (!user || !user.companyId) {
			return res.status(403).json({ error: 'Company not found' });
		}

		const existing = await Order.findOne({
			companyId: user.companyId,
			bankId: bank._id,
			type: 'free',
		});
		if (existing) {
			return res.json({ orderId: existing._id });
		}

		const order = await Order.create({
			companyId: user.companyId,
			bankId: bank._id,
			amount: 0,
			currency: 'USD',
			status: 'paid',
			type: 'free',
		});

		console.log('analytics:free_bank_checkout_confirmed', {
			bankId: bank._id.toString(),
			orderId: order._id.toString(),
		});

		await grantFreeAccess(user.companyId, bank._id, user._id);

		await FreeBankAccessLog.create({
			companyId: user.companyId,
			bankId: bank._id,
			orderId: order._id,
			type: 'free',
			action: 'granted',
		});

		console.log('analytics:free_bank_access_granted', {
			bankId: bank._id.toString(),
			companyId: user.companyId.toString(),
		});

		res.json({ orderId: order._id });
	} catch (error) {
		console.error('Error processing free checkout:', error);
		res.status(500).json({ error: 'Failed to process free checkout', details: error.message });
	}
});

module.exports = router;
