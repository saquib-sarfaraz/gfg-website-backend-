const express = require('express');
const router = express.Router();
const { login, signup, logout, getMe, seedAdmin } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);
router.post('/seed-admin', seedAdmin);

module.exports = router;
