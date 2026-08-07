const express = require('express');
const router = express.Router();
const { createReport, getAdminModerationQueue, reviewModerationItem } = require('../controllers/reportController');
const { authMiddleware, hasPermission } = require('../middleware/auth');

// Member Endpoint: Submit a Report
router.post('/', authMiddleware, createReport);

// Super Admin / Moderator Endpoints (RBAC protected)
router.get('/admin', getAdminModerationQueue);
router.patch('/admin/:targetType/:targetId/review', reviewModerationItem);

module.exports = router;
