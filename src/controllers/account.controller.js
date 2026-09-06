const mongoose = require("mongoose");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const { calculateBalance } = require("../utils/balance.util");


async function fetchBalance(req, res) {
  try {
    const account = await accountModel.findOne({ user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const balance = await calculateBalance(account._id);

    res.status(200).json({ accountId: account._id, balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const BONUS_AMOUNT = 500; // fixed amount, jo tu chahe

async function claimBonus(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userAccount = await accountModel.findOne({ user: req.user._id }).session(session);

    if (userAccount.bonusClaimed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Bonus already claimed" });
    }

    const systemAccount = await accountModel.findById(process.env.SYSTEM_ACCOUNT_ID).session(session);

    const transaction = await transactionModel.create(
      [{
        fromAccount: systemAccount._id,
        toAccount: userAccount._id,
        amount: BONUS_AMOUNT,
        status: "completed",
        idempotencyKey: `bonus-${req.user._id}`, // user ID se bandha - dobara claim nahi ho sakta DB level pe bhi
      }],
      { session }
    );

  await ledgerModel.create(
  [
    { account: systemAccount._id, transactionId: transaction[0]._id, type: "debit", amount: BONUS_AMOUNT },
    { account: userAccount._id, transactionId: transaction[0]._id, type: "credit", amount: BONUS_AMOUNT },
  ],
  { session, ordered: true }
);

    userAccount.bonusClaimed = true;
    await userAccount.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Bonus claimed successfully", amount: BONUS_AMOUNT });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error claiming bonus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function systemTransfer(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toUserId, amount } = req.body;

    if (!toUserId || !amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Valid toUserId and amount required" });
    }

    const systemAccount = await accountModel.findById(process.env.SYSTEM_ACCOUNT_ID).session(session);
    const userAccount = await accountModel.findOne({ user: toUserId }).session(session);

    if (!userAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Recipient account not found" });
    }

    // Balance check yahan JAANBUJH kar nahi hai - System account unlimited hai
    const transaction = await transactionModel.create(
      [{
        fromAccount: systemAccount._id,
        toAccount: userAccount._id,
        amount,
        status: "completed",
        idempotencyKey: `admin-transfer-${req.user._id}-${Date.now()}`,
      }],
      { session }
    );

    await ledgerModel.create(
      [
        { account: systemAccount._id, transactionId: transaction[0]._id, type: "debit", amount },
        { account: userAccount._id, transactionId: transaction[0]._id, type: "credit", amount },
      ],
      { session, ordered: true }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Transfer successful", amount, toUserId });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in system transfer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getTransactionHistory(req, res) {
  try {
    const account = await accountModel.findOne({ user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await transactionModel
      .find({
        $or: [{ fromAccount: account._id }, { toAccount: account._id }],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await transactionModel.countDocuments({
      $or: [{ fromAccount: account._id }, { toAccount: account._id }],
    });

    res.status(200).json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { fetchBalance, claimBonus, systemTransfer, getTransactionHistory };



