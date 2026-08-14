const express = require('express');
const router = express.Router();
const { login, adminLogin, signup, logout, getMe, refreshToken, changePassword, changeAdminPin } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiter');

router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/admin-login', loginLimiter, adminLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/change-password', authMiddleware, changePassword);
router.patch('/change-admin-pin', authMiddleware, changeAdminPin);

module.exports = router;
