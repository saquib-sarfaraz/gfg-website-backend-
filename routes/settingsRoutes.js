const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getSettings);
router.put('/', authMiddleware, updateSettings);

module.exports = router;
