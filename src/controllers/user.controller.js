const userModel = require("../models/user.model");

async function lookupUser(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Apne aap ko dhoondne se rokna
    if (normalizedEmail === req.user.email) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    const user = await userModel.findOne({ email: normalizedEmail }).select("name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    console.error("Error looking up user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { lookupUser };