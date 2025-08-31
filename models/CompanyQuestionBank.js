const mongoose = require('mongoose');

const companyQuestionBankSchema = new mongoose.Schema({
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
  source: {
    type: String,
    default: 'public',
  },
  accessType: {
    type: String,
    default: 'free',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

companyQuestionBankSchema.index({ companyId: 1, bankId: 1 }, { unique: true });

module.exports = mongoose.model('CompanyQuestionBank', companyQuestionBankSchema);
