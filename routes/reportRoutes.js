const express = require('express');
const router = express.Router();
const { createReport, getAdminModerationQueue, reviewModerationItem } = require('../controllers/reportController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Member Endpoint: Submit a Report
router.post('/', authMiddleware, createReport);

// Super Admin / Moderator Endpoints (RBAC protected)
router.get('/admin', authMiddleware, adminOnly, getAdminModerationQueue);
router.patch('/admin/:targetType/:targetId/review', authMiddleware, adminOnly, reviewModerationItem);

module.exports = router;
