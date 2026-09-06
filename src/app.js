const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.router");
const accountRouter = require("./routes/account.router");
const transferrouter = require("./routes/transfer.router");



const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());


// Routes
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transfer", transferrouter);



module.exports = app;
