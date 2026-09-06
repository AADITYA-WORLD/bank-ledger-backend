const ledgerModel = require("../models/ledger.model");

async function calculateBalance(accountId, session = null) {
  const query = ledgerModel.aggregate([
    { $match: { account: accountId } },
    {
      $group: {
        _id: null,
        totalDebits: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } },
        totalCredits: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
      },
    },
  ]);

  // Aggregate pe session lagane ka tareeka thoda alag hota hai find/create se
  if (session) {
    query.session(session);
  }

  const result = await query;
  return result.length > 0 ? result[0].totalCredits - result[0].totalDebits : 0;
}

module.exports = { calculateBalance };