const express = require('express');
const router = express.Router();
const { 
  getSettings, 
  updateSettings,
  getLaunchSettings,
  updateLaunchSettings
} = require('../controllers/settingsController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// General Site Settings
router.get('/', getSettings);
router.put('/', authMiddleware, adminOnly, updateSettings);

// Launch Experience Configuration
router.get('/launch', getLaunchSettings);
router.put('/launch', authMiddleware, adminOnly, updateLaunchSettings);

module.exports = router;
