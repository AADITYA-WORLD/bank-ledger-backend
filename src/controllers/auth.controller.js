const mongoose = require("mongoose");
const userModel = require("../models/user.model");
const { generateTokenSetCookie } = require("../utils/token.util");
const accountModel = require("../models/account.model");
const { sendWelcomeEmail } = require("../utils/email.util");
const jwt = require("jsonwebtoken");
const BlacklistToken = require("../models/blocklistToken.model");


async function registerUser(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!name || !normalizedEmail || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await userModel.findOne({ email: normalizedEmail }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await userModel.create([{ name, email: normalizedEmail, password }], { session });
    const newAccount = await accountModel.create([{ user: newUser[0]._id }], { session });

    await session.commitTransaction();
    session.endSession();

    const token = await generateTokenSetCookie({ id: newUser[0]._id }, res);

   console.log("About to send welcome email to:", newUser[0].email);

    sendWelcomeEmail({
      name: newUser[0].name,
      email: newUser[0].email,
      accountNumber: newAccount[0]._id,
    })
    .then(() => console.log("Welcome email sent successfully"))
    .catch((err) => console.error("Welcome email failed:", err.message));

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser[0]._id,
        name: newUser[0].name,
        email: newUser[0].email,
        accountId: newAccount[0]._id,
        role: newUser[0].role,
      },
      token,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = await generateTokenSetCookie({ id: user._id }, res);

    res.status(200).json({ 
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getMe(req, res) {
  try {
    res.status(200).json({ 
      message: "User data retrieved successfully",
      user: req.user
    });
  } catch (error) {
    console.error("Error retrieving user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


async function logoutUser(req, res) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "No token found" });
    }

    // Token decode karo (verify nahi, sirf decode - kyuki hume expiry chahiye)
    const decoded = jwt.decode(token);

    if (decoded?.exp) {
      await BlacklistToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000), // JWT ka exp seconds me hota hai, Date ko milliseconds chahiye
      });
    }

    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser
};  
