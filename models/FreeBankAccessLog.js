const mongoose = require('mongoose');

const freeBankAccessLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'PublicBank', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  type: { type: String, default: 'free' },
  action: { type: String, default: 'granted' },
  createdAt: { type: Date, default: Date.now }
});

freeBankAccessLogSchema.index({ companyId: 1, bankId: 1, createdAt: -1 });

module.exports = mongoose.model('FreeBankAccessLog', freeBankAccessLogSchema);

