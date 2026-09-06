const express = require("express");
const { transferMoney } = require("../controllers/transfer.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/transfer-money", authMiddleware, transferMoney);

module.exports = router;