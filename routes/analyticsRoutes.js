const express = require('express');
const router = express.Router();
const { getStatsOverview } = require('../controllers/analyticsController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/stats', authMiddleware, getStatsOverview);
router.get('/dashboard', authMiddleware, adminOnly, getStatsOverview);

module.exports = router;
