const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const AdminAccess = require('../models/AdminAccess');
const User = require('../models/User');
const Member = require('../models/Member');
const AdminAuditLog = require('../models/AdminAuditLog');

// Helper: Generate a secure 6-digit random PIN
const generate6DigitPin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. GET ALL ADMINISTRATORS
exports.getAdministrators = async (req, res) => {
  try {
    const admins = await AdminAccess.find({})
      .populate({
        path: 'userRef',
        select: 'username email role collegeName avatar memberRef',
        populate: {
          path: 'memberRef',
          select: 'name email role accountType membershipStatus photo'
        }
      })
      .populate('createdBy', 'username email')
      .select('-pinHash')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: admins.length, data: admins });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch administrators: ' + err.message });
  }
};

// 2. GRANT ADMINISTRATIVE ACCESS
exports.grantAdminAccess = async (req, res) => {
  try {
    const { userId, email, adminRole, permissions, customPin } = req.body;
    const operatorId = req.user._id;

    if (!userId && !email) {
      return res.status(400).json({ success: false, message: 'User ID or Email is required.' });
    }

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Selected User account was not found.' });
    }

    // Check existing AdminAccess
    let existingAccess = await AdminAccess.findOne({ userRef: user._id });
    if (existingAccess && existingAccess.status === 'Active') {
      return res.status(400).json({ success: false, message: 'This user already has active administrative access.' });
    }

    // Determine 6-digit PIN
    let rawPin = customPin ? String(customPin).trim() : generate6DigitPin();
    if (rawPin.length < 4 || rawPin.length > 8) {
      return res.status(400).json({ success: false, message: 'Admin PIN must be between 4 and 8 digits (6 digits recommended).' });
    }

    const pinHash = await bcrypt.hash(rawPin, 10);
    const assignedRole = adminRole && ['SUPER_ADMIN', 'ADMIN'].includes(adminRole) ? adminRole : 'ADMIN';
    const assignedPermissions = Array.isArray(permissions) ? permissions : ['manage_members', 'manage_events'];

    if (!existingAccess) {
      existingAccess = await AdminAccess.create({
        userRef: user._id,
        adminRole: assignedRole,
        permissions: assignedPermissions,
        pinHash,
        status: 'Active',
        createdBy: operatorId
      });
    } else {
      existingAccess.adminRole = assignedRole;
      existingAccess.permissions = assignedPermissions;
      existingAccess.pinHash = pinHash;
      existingAccess.status = 'Active';
      existingAccess.failedLoginAttempts = 0;
      existingAccess.lockedUntil = null;
      existingAccess.createdBy = operatorId;
      await existingAccess.save();
    }

    // Log Security Audit
    await AdminAuditLog.create({
      operatorRef: operatorId,
      operatorEmail: req.user.email,
      targetUserRef: user._id,
      targetEmail: user.email,
      action: 'ADMIN_ACCESS_GRANTED',
      details: `Granted ${assignedRole} access with permissions: ${assignedPermissions.join(', ')}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });

    const populated = await AdminAccess.findById(existingAccess._id)
      .populate('userRef', 'username email role avatar')
      .select('-pinHash');

    // Return rawPin ONCE in response for UI display
    return res.status(201).json({
      success: true,
      message: `✓ Administrative access granted to ${user.username}.`,
      data: populated,
      generatedPin: rawPin // SHOWN ONLY ONCE!
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to grant admin access: ' + err.message });
  }
};

// 3. RESET ADMIN PIN
exports.resetAdminPin = async (req, res) => {
  try {
    const { id } = req.params; // AdminAccess ID
    const { customPin } = req.body;
    const operatorId = req.user._id;

    const adminAccess = await AdminAccess.findById(id).populate('userRef', 'username email');
    if (!adminAccess) {
      return res.status(404).json({ success: false, message: 'AdminAccess record not found.' });
    }

    // Root Admin Protection: Only ROOT_SUPER_ADMIN can reset ROOT_SUPER_ADMIN PIN
    if (adminAccess.adminRole === 'ROOT_SUPER_ADMIN' && req.adminAccess?.adminRole !== 'ROOT_SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Root Super Admin can reset the Root Super Admin PIN.' });
    }

    let rawPin = customPin ? String(customPin).trim() : generate6DigitPin();
    if (rawPin.length < 4 || rawPin.length > 8) {
      return res.status(400).json({ success: false, message: 'Admin PIN must be between 4 and 8 digits (6 digits recommended).' });
    }

    adminAccess.pinHash = await bcrypt.hash(rawPin, 10);
    adminAccess.failedLoginAttempts = 0;
    adminAccess.lockedUntil = null;
    await adminAccess.save();

    await AdminAuditLog.create({
      operatorRef: operatorId,
      operatorEmail: req.user.email,
      targetUserRef: adminAccess.userRef._id,
      targetEmail: adminAccess.userRef.email,
      action: 'ADMIN_PIN_RESET',
      details: 'Administrator PIN was reset by operator',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });

    // Return rawPin ONCE in response for UI display
    return res.json({
      success: true,
      message: `✓ Admin PIN reset successfully for ${adminAccess.userRef.username}.`,
      generatedPin: rawPin // SHOWN ONLY ONCE!
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset admin PIN: ' + err.message });
  }
};

// 4. UPDATE ADMIN ROLE / PERMISSIONS / STATUS
exports.updateAdminAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRole, permissions, status } = req.body;
    const operatorId = req.user._id;

    const adminAccess = await AdminAccess.findById(id).populate('userRef', 'username email');
    if (!adminAccess) {
      return res.status(404).json({ success: false, message: 'AdminAccess record not found.' });
    }

    // Root Admin Protection: ROOT_SUPER_ADMIN cannot be demoted or suspended by anyone
    if (adminAccess.adminRole === 'ROOT_SUPER_ADMIN') {
      if (status && status !== 'Active') {
        return res.status(403).json({ success: false, message: 'The Root Super Admin account cannot be suspended or revoked.' });
      }
      if (adminRole && adminRole !== 'ROOT_SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'The Root Super Admin role cannot be demoted.' });
      }
    }

    if (adminRole && ['SUPER_ADMIN', 'ADMIN'].includes(adminRole)) {
      adminAccess.adminRole = adminRole;
    }
    if (Array.isArray(permissions)) {
      adminAccess.permissions = permissions;
    }
    if (status && ['Active', 'Suspended', 'Revoked'].includes(status)) {
      adminAccess.status = status;
    }

    await adminAccess.save();

    await AdminAuditLog.create({
      operatorRef: operatorId,
      operatorEmail: req.user.email,
      targetUserRef: adminAccess.userRef._id,
      targetEmail: adminAccess.userRef.email,
      action: status === 'Suspended' ? 'ADMIN_SUSPENDED' : 'ADMIN_ROLE_CHANGED',
      details: `Updated role to ${adminAccess.adminRole}, status to ${adminAccess.status}`,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });

    const populated = await AdminAccess.findById(adminAccess._id)
      .populate('userRef', 'username email role avatar')
      .select('-pinHash');

    return res.json({ success: true, message: '✓ Administrator settings updated.', data: populated });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update admin settings: ' + err.message });
  }
};

// 5. REVOKE ADMIN ACCESS
exports.revokeAdminAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const operatorId = req.user._id;

    const adminAccess = await AdminAccess.findById(id).populate('userRef', 'username email');
    if (!adminAccess) {
      return res.status(404).json({ success: false, message: 'AdminAccess record not found.' });
    }

    if (adminAccess.adminRole === 'ROOT_SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'The Root Super Admin access cannot be revoked.' });
    }

    await AdminAccess.findByIdAndDelete(id);

    await AdminAuditLog.create({
      operatorRef: operatorId,
      operatorEmail: req.user.email,
      targetUserRef: adminAccess.userRef._id,
      targetEmail: adminAccess.userRef.email,
      action: 'ADMIN_ACCESS_REVOKED',
      details: 'Revoked administrative access permanently',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });

    return res.json({ success: true, message: `✓ Administrative access revoked for ${adminAccess.userRef.username}.` });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to revoke admin access: ' + err.message });
  }
};

// 6. GET SECURITY AUDIT LOGS
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AdminAuditLog.find({})
      .populate('operatorRef', 'username email')
      .populate('targetUserRef', 'username email')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch security audit logs: ' + err.message });
  }
};
