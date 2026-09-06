require("dotenv").config();
const mongoose = require("mongoose");
const userModel = require("../models/user.model");
const accountModel = require("../models/account.model");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existingSystemUser = await userModel.findOne({ email: "system@bank.internal" });

    if (existingSystemUser) {
      console.log("System user already exists:", existingSystemUser._id);

      const existingAccount = await accountModel.findOne({ user: existingSystemUser._id });
      console.log("System account:", existingAccount._id);

      return process.exit(0);
    }

    const systemUser = await userModel.create({
      name: "System Reserve",
      email: "system@bank.internal",
      password: "N3verLogin$SystemAcc123",
    });

    const systemAccount = await accountModel.create({ user: systemUser._id });

    console.log("System user created:", systemUser._id);
    console.log("System account created:", systemAccount._id);
    console.log("\n");
    console.log(`SYSTEM_ACCOUNT_ID=${systemAccount._id}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding system account:", error);
    process.exit(1);
  }
}

seed();