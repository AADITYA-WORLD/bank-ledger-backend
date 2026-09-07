const express = require("express");
const { lookupUser } = require("../controllers/user.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/lookup", authMiddleware, lookupUser);

module.exports = router;