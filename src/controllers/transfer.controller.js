const mongoose = require("mongoose");
const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const { calculateBalance } = require("../utils/balance.util");
const { sendDebitEmail, sendCreditEmail } = require("../utils/email.util");


async function transferMoney(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toUserId, amount, idempotencyKey } = req.body;

    // 1. Basic validation
    if (!toUserId || !amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Valid toUserId and amount required" });
    }

    if (!idempotencyKey) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "idempotencyKey is required" });
    }

    if (toUserId === req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    // 2. Idempotency check - pehle dekho ye request pehle hi process ho chuki hai kya
    const existingTransaction = await transactionModel.findOne({ idempotencyKey }).session(session);
    if (existingTransaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        message: "Transaction already processed",
        transactionId: existingTransaction._id,
        status: existingTransaction.status,
      });
    }

    // 3. Sender aur receiver ke accounts dhundo
    const senderAccount = await accountModel.findOne({ user: req.user._id }).session(session);
    const receiverAccount = await accountModel.findOne({ user: toUserId }).session(session);

    if (!receiverAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Recipient account not found" });
    }

    if (senderAccount.status !== "active" || receiverAccount.status !== "active") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "One of the accounts is not active" });
    }

    // 4. Balance check - System account ke liye skip (abhi tak sirf normal users hi ye route use karenge, but future-safe rakha)
    const isSenderSystemAccount = senderAccount._id.toString() === process.env.SYSTEM_ACCOUNT_ID;

    if (!isSenderSystemAccount) {
      const senderBalance = await calculateBalance(senderAccount._id, session);
      if (senderBalance < amount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Insufficient balance" });
      }
    }

    // 5. Transaction record banao
    const transaction = await transactionModel.create(
      [{
        fromAccount: senderAccount._id,
        toAccount: receiverAccount._id,
        amount,
        status: "completed",
        idempotencyKey,
      }],
      { session }
    );

    // 6. Double-entry Ledger banao
    await ledgerModel.create(
      [
        { account: senderAccount._id, transactionId: transaction[0]._id, type: "debit", amount },
        { account: receiverAccount._id, transactionId: transaction[0]._id, type: "credit", amount },
      ],
      { session, ordered: true }
    );

    await session.commitTransaction();
    session.endSession();

      const senderUser = await userModel.findById(req.user._id);
      const receiverUser = await userModel.findById(toUserId);

     sendDebitEmail({
      senderName: senderUser.name,
      senderEmail: senderUser.email,
      receiverName: receiverUser.name,
      receiverEmail: receiverUser.email,
      amount,
      transactionId: transaction[0]._id,
    }).catch((err) => console.error("Debit email failed:", err.message));

    sendCreditEmail({
      senderName: senderUser.name,
      senderEmail: senderUser.email,
      receiverName: receiverUser.name,
      receiverEmail: receiverUser.email,
      amount,
      transactionId: transaction[0]._id,
    }).catch((err) => console.error("Credit email failed:", err.message));

    res.status(200).json({
      message: "Transfer successful",
      transactionId: transaction[0]._id,
      amount,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in transfer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { transferMoney };