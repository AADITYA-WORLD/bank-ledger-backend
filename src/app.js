const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.router");
const accountRouter = require("./routes/account.router");
const transferrouter = require("./routes/transfer.router");
const userRouter = require("./routes/user.router");
const cors = require("cors");



const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "https://bank-frontend-peach.vercel.app"],
  credentials: true,
}));


// Routes
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transfer", transferrouter);
app.use("/api/users", userRouter);



module.exports = app;
