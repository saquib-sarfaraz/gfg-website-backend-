const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getSettings);
router.put('/', authMiddleware, adminOnly, updateSettings);

module.exports = router;
