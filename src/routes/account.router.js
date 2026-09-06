const express = require("express");
const {fetchBalance, claimBonus,systemTransfer, getTransactionHistory} = require("../controllers/account.controller");
const {authMiddleware, isAdmin} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/balance", authMiddleware, fetchBalance);
router.post("/claim-bonus", authMiddleware, claimBonus);
router.post("/system-transfer", authMiddleware, isAdmin, systemTransfer);
router.get("/transactions", authMiddleware, getTransactionHistory);

module.exports = router;