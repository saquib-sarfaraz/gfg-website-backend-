const express = require('express');
const router = express.Router();
const { login, adminLogin, signup, logout, getMe, changePassword, changeAdminPin } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/change-password', authMiddleware, changePassword);
router.patch('/change-admin-pin', authMiddleware, changeAdminPin);

module.exports = router;
