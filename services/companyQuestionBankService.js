const CompanyQuestionBank = require('../models/CompanyQuestionBank');
const Entitlement = require('../models/Entitlement');

async function grantFreeAccess(companyId, bankId, userId) {
  await CompanyQuestionBank.findOneAndUpdate(
    { companyId, bankId },
    {
      $setOnInsert: {
        source: 'public',
        accessType: 'free',
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  await Entitlement.grantFreeAccess(companyId, bankId, userId);
}

module.exports = {
  grantFreeAccess,
};
