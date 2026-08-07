const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware, adminOnly, requirePermission } = require('../middleware/auth');
const {
  getAdministrators,
  grantAdminAccess,
  resetAdminPin,
  updateAdminAccess,
  revokeAdminAccess,
  getAuditLogs
} = require('../controllers/adminManagementController');

const { getUserStats, getUsers, getUserById, getUserActivity } = require('../controllers/userDirectoryController');

// ─── User Directory Endpoints (Strict AdminOnly) ──────────────────────
router.get('/users/stats', authMiddleware, adminOnly, getUserStats);
router.get('/users', authMiddleware, adminOnly, getUsers);
router.get('/users/:userId/activity', authMiddleware, adminOnly, getUserActivity);
router.get('/users/:userId', authMiddleware, adminOnly, getUserById);

// ─── Administrators & Audit Management Endpoints (Strict AdminOnly) ────
router.get('/administrators', authMiddleware, adminOnly, getAdministrators);
router.post('/administrators', authMiddleware, adminOnly, requirePermission('manage_admins'), grantAdminAccess);
router.post('/administrators/:id/reset-pin', authMiddleware, adminOnly, requirePermission('manage_admins'), resetAdminPin);
router.patch('/administrators/:id', authMiddleware, adminOnly, requirePermission('manage_admins'), updateAdminAccess);
router.delete('/administrators/:id', authMiddleware, adminOnly, requirePermission('manage_admins'), revokeAdminAccess);

// Audit Logs
router.get('/audit-logs', authMiddleware, adminOnly, requirePermission('manage_admins'), getAuditLogs);

module.exports = router;
