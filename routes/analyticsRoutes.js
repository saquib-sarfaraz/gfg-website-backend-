const express = require('express');
const router = express.Router();
const { getStatsOverview } = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/auth');

router.get('/stats', authMiddleware, getStatsOverview);

module.exports = router;
