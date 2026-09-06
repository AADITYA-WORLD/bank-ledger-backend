const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const Router = express.Router();

Router.post('/register', authController.registerUser);
Router.post('/login', authController.loginUser);
Router.get('/getme', authMiddleware.authMiddleware, authController.getMe);
Router.post("/logout", authMiddleware.authMiddleware, authController.logoutUser);

module.exports = Router;