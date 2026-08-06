const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly, requirePermission } = require('../middleware/auth');
const {
  getAdministrators,
  grantAdminAccess,
  resetAdminPin,
  updateAdminAccess,
  revokeAdminAccess,
  getAuditLogs
} = require('../controllers/adminManagementController');

// All endpoints require active AdminAccess
router.use(authMiddleware, adminOnly);

// Administrators Management
router.get('/administrators', getAdministrators);
router.post('/administrators', requirePermission('manage_admins'), grantAdminAccess);
router.post('/administrators/:id/reset-pin', requirePermission('manage_admins'), resetAdminPin);
router.patch('/administrators/:id', requirePermission('manage_admins'), updateAdminAccess);
router.delete('/administrators/:id', requirePermission('manage_admins'), revokeAdminAccess);

// Audit Logs
router.get('/audit-logs', requirePermission('manage_admins'), getAuditLogs);

module.exports = router;
