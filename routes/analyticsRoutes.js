const express = require('express');
const router = express.Router();
const { getStatsOverview } = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/auth');

router.get('/stats', authMiddleware, getStatsOverview);
router.get('/dashboard', getStatsOverview);

module.exports = router;
