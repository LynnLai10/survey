const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
	companyId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Company',
		required: true,
	},
	bankId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'PublicBank',
		required: true,
	},
	amount: {
		type: Number,
		default: 0,
	},
	currency: {
		type: String,
		default: 'USD',
	},
	status: {
		type: String,
		enum: ['paid', 'pending', 'failed'],
		default: 'paid',
	},
	type: {
		type: String,
		enum: ['free', 'paid'],
		default: 'free',
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

orderSchema.index({ companyId: 1, bankId: 1, type: 1 });

module.exports = mongoose.model('Order', orderSchema);
