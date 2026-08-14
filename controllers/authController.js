const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Member = require('../models/Member');
const AdminAccess = require('../models/AdminAccess');
const AdminAuditLog = require('../models/AdminAuditLog');
const { JWT_SECRET } = require('../middleware/auth');

const { generateUserCode } = require('../utils/userCodeGenerator');

// Cookie Helper Utilities for Persistent Session Refresh Tokens
const getCookieFromReq = (req, cookieName) => {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setRefreshCookie = (res, refreshToken) => {
  try {
    res.cookie('gfg_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  } catch (e) {}
};

// SIGNUP HANDLER (Public User Signup -> Visitor)
exports.signup = async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, isJamia, collegeName, course } = req.body;

    if (!fullName || !email || !password || !confirmPassword || isJamia === undefined) {
      return res.status(400).json({ success: false, message: 'Please fill in all required onboarding fields.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address (e.g. name@domain.com).' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    const institutionType = isJamia === true || isJamia === 'true' ? 'jamia_hamdard' : 'other';
    const finalCollegeName = institutionType === 'jamia_hamdard' ? 'Jamia Hamdard' : (collegeName || '').trim();

    if (institutionType === 'other' && !finalCollegeName) {
      return res.status(400).json({ success: false, message: 'College / University Name is required when you are not from Jamia Hamdard.' });
    }

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account already exists with this email. Sign in instead.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const cleanUsername = fullName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;

      // Generate unique platform userCode
      let userCode;
      let isCodeUnique = false;
      let attempts = 0;
      while (!isCodeUnique && attempts < 10) {
        userCode = generateUserCode();
        const codeCollision = await User.findOne({ userCode }) || await Member.findOne({ userCode });
        if (!codeCollision) {
          isCodeUnique = true;
        }
        attempts++;
      }

      const newMember = await Member.create({
        userCode,
        name: fullName.trim(),
        username: cleanUsername,
        email: normalizedEmail,
        phone: phone ? phone.trim() : '',
        teamName: 'General',
        role: 'Visitor',
        accountType: 'Visitor',
        membershipStatus: 'pending',
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2f9e44&color=fff&bold=true`,
        about: `Student at ${finalCollegeName}. Joined GFG Campus Community.`,
        session: '2026–27'
      });

      const newUser = await User.create({
        userCode,
        username: cleanUsername,
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : '',
        role: 'Visitor',
        institutionType,
        collegeName: finalCollegeName,
        course: course ? course.trim() : '',
        memberRef: newMember._id,
        avatar: newMember.photo
      });

      newMember.userRef = newUser._id;
      await newMember.save();

      req.app.get('io')?.emit('admin:member-created', { member: newMember, user: newUser });

      const token = jwt.sign(
        { id: newUser._id, userCode: newUser.userCode, username: newUser.username, email: newUser.email, role: 'Visitor', memberId: newMember._id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      const refreshToken = jwt.sign(
        { id: newUser._id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      setRefreshCookie(res, refreshToken);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully as Visitor. Welcome to GFG Campus Community!',
        token,
        user: {
          id: newUser._id,
          userCode: newUser.userCode,
          username: newUser.username,
          email: newUser.email,
          role: 'Visitor',
          collegeName: finalCollegeName,
          institutionType
        },
        member: newMember
      });
    } else {
      return res.status(503).json({ success: false, message: 'Database connection offline. Please check MongoDB Atlas connection.' });
    }
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(409).json({ success: false, message: 'An account already exists with this email. Sign in instead.' });
      }
    }
    console.error('[Signup Error]:', err);
    return res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
};

// PUBLIC USER LOGIN HANDLER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail }).populate('memberRef');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      let member = user.memberRef || await Member.findOne({ email: normalizedEmail });

      const adminAccess = await AdminAccess.findOne({ userRef: user._id, status: 'Active' });

      const token = jwt.sign(
        { id: user._id, username: user.username, email: user.email, role: member?.role || user.role, isAdmin: !!adminAccess },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      const refreshToken = jwt.sign(
        { id: user._id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      setRefreshCookie(res, refreshToken);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          collegeName: user.collegeName
        },
        member: member || null,
        adminAccess: adminAccess ? {
          adminRole: adminAccess.adminRole,
          permissions: adminAccess.permissions
        } : null
      });
    } else {
      return res.status(503).json({ success: false, message: 'Database connection offline. Please check MongoDB Atlas connection.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login error: ' + err.message });
  }
};

// 3-FACTOR SUPER ADMIN LOGIN HANDLER (Email + Password + Individual Admin PIN)
exports.adminLogin = async (req, res) => {
  const { email, password, pin } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!email || !password || !pin) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide Email, Password, and Admin PIN.' 
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanPin = String(pin).trim();

  const logAudit = async (action, targetUser, details) => {
    try {
      await AdminAuditLog.create({
        operatorRef: targetUser ? targetUser._id : null,
        operatorEmail: normalizedEmail,
        targetUserRef: targetUser ? targetUser._id : null,
        targetEmail: normalizedEmail,
        action,
        details,
        ipAddress,
        userAgent
      });
    } catch (e) {
      console.warn('[Audit Log Error]:', e.message);
    }
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database connection offline. Admin login requires an active MongoDB connection.' 
      });
    }

    // 1. User lookup
    const user = await User.findOne({ email: normalizedEmail }).populate('memberRef');
    if (!user) {
      await logAudit('ADMIN_LOGIN_FAILED', null, 'Invalid identity');
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    // 2. AdminAccess lookup
    const adminAccess = await AdminAccess.findOne({ userRef: user._id });
    if (!adminAccess || adminAccess.status !== 'Active') {
      await logAudit('ADMIN_LOGIN_FAILED', user, 'No active administrative access record');
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    // 3. Brute-force lockout check
    if (adminAccess.lockedUntil && adminAccess.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((adminAccess.lockedUntil - new Date()) / (1000 * 60));
      await logAudit('ADMIN_LOGIN_FAILED', user, `Attempt on locked account (${minutesRemaining} mins remaining)`);
      return res.status(429).json({
        success: false,
        message: `Administrative access is temporarily locked due to excessive failed attempts. Try again in ${minutesRemaining} minutes.`
      });
    }

    // 4. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      adminAccess.failedLoginAttempts = (adminAccess.failedLoginAttempts || 0) + 1;
      if (adminAccess.failedLoginAttempts >= 5) {
        adminAccess.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await adminAccess.save();
      await logAudit('ADMIN_LOGIN_FAILED', user, `Password incorrect (Attempt #${adminAccess.failedLoginAttempts})`);
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    // 5. Verify Admin PIN (pinHash)
    const isPinValid = await bcrypt.compare(cleanPin, adminAccess.pinHash);
    if (!isPinValid) {
      adminAccess.failedLoginAttempts = (adminAccess.failedLoginAttempts || 0) + 1;
      if (adminAccess.failedLoginAttempts >= 5) {
        adminAccess.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await adminAccess.save();
      await logAudit('ADMIN_LOGIN_FAILED', user, `Admin PIN incorrect (Attempt #${adminAccess.failedLoginAttempts})`);
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    // 6. Reset Lockout & Log Success
    adminAccess.failedLoginAttempts = 0;
    adminAccess.lockedUntil = null;
    adminAccess.lastLoginAt = new Date();
    await adminAccess.save();

    await logAudit('ADMIN_LOGIN_SUCCESS', user, `Successful administrative login as ${adminAccess.adminRole}`);

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        username: user.username,
        adminRole: adminAccess.adminRole,
        isAdmin: true 
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    const refreshToken = jwt.sign(
      { id: user._id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    setRefreshCookie(res, refreshToken);

    let member = user.memberRef || await Member.findOne({ email: normalizedEmail });

    return res.json({
      success: true,
      message: 'Administrative authentication successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      member: member || null,
      adminAccess: {
        adminRole: adminAccess.adminRole,
        permissions: adminAccess.permissions,
        lastLoginAt: adminAccess.lastLoginAt
      }
    });

  } catch (err) {
    console.error('[Admin Login Error]:', err);
    return res.status(500).json({ success: false, message: 'Administrative authentication error: ' + err.message });
  }
};

// GET ME SESSION RESTORE HANDLER
exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (mongoose.connection.readyState === 1) {
      if (req.logStep) req.logStep('user_query_start');
      const user = await User.findById(decoded.id).populate('memberRef');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      if (req.logStep) req.logStep('user_query_done');

      const [member, adminAccess] = await Promise.all([
        user.memberRef ? Promise.resolve(user.memberRef) : Member.findOne({ email: user.email }),
        AdminAccess.findOne({ userRef: user._id, status: 'Active' })
      ]);
      if (req.logStep) req.logStep('parallel_db_done');

      return res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          collegeName: user.collegeName
        },
        member: member || null,
        adminAccess: adminAccess ? {
          adminRole: adminAccess.adminRole,
          permissions: adminAccess.permissions,
          lastLoginAt: adminAccess.lastLoginAt
        } : null
      });
    } else {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// CHANGE PASSWORD HANDLER
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Current password, new password, and confirm password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'Your new password must be different from your current password.' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Account user record not found.' });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();

      return res.json({
        success: true,
        message: '✓ Password updated successfully. Please sign in again.'
      });
    } else {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update password: ' + err.message });
  }
};

// CHANGE ADMIN PIN (Self Service)
exports.changeAdminPin = async (req, res) => {
  try {
    const { currentPin, newPin, confirmPin } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!currentPin || !newPin || !confirmPin) {
      return res.status(400).json({ success: false, message: 'Current PIN, new PIN, and confirm PIN are required.' });
    }

    const cleanNewPin = String(newPin).trim();
    if (cleanNewPin.length < 4 || cleanNewPin.length > 8) {
      return res.status(400).json({ success: false, message: 'New Admin PIN must be between 4 and 8 digits (6 digits recommended).' });
    }

    if (cleanNewPin !== String(confirmPin).trim()) {
      return res.status(400).json({ success: false, message: 'New PIN and confirm PIN do not match.' });
    }

    const adminAccess = await AdminAccess.findOne({ userRef: userId });
    if (!adminAccess || adminAccess.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'No active administrative access record found.' });
    }

    const isCurrentValid = await bcrypt.compare(String(currentPin).trim(), adminAccess.pinHash);
    if (!isCurrentValid) {
      return res.status(400).json({ success: false, message: 'Current Admin PIN is incorrect.' });
    }

    adminAccess.pinHash = await bcrypt.hash(cleanNewPin, 10);
    await adminAccess.save();

    await AdminAuditLog.create({
      operatorRef: userId,
      operatorEmail: req.user.email,
      targetUserRef: userId,
      targetEmail: req.user.email,
      action: 'ADMIN_PIN_CHANGED',
      details: 'Administrator updated their own PIN',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });

    return res.json({
      success: true,
      message: '✓ Admin PIN updated successfully.'
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to change Admin PIN: ' + err.message });
  }
};

// SILENT REFRESH TOKEN HANDLER (Extends session without re-prompting login)
exports.refreshToken = async (req, res) => {
  try {
    const cookieToken = getCookieFromReq(req, 'gfg_refresh_token');
    const rawToken = cookieToken || req.body?.refreshToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'No refresh session token provided.' });
    }

    const decoded = jwt.verify(rawToken, JWT_SECRET);
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database offline.' });
    }

    const user = await User.findById(decoded.id).populate('memberRef');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User record not found.' });
    }

    const [member, adminAccess] = await Promise.all([
      user.memberRef ? Promise.resolve(user.memberRef) : Member.findOne({ email: user.email }),
      AdminAccess.findOne({ userRef: user._id, status: 'Active' })
    ]);

    const newAccessToken = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: member?.role || user.role, isAdmin: !!adminAccess },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      success: true,
      token: newAccessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        collegeName: user.collegeName
      },
      member: member || null,
      adminAccess: adminAccess ? {
        adminRole: adminAccess.adminRole,
        permissions: adminAccess.permissions,
        lastLoginAt: adminAccess.lastLoginAt
      } : null
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// LOGOUT HANDLER
exports.logout = async (req, res) => {
  try {
    res.clearCookie('gfg_refresh_token', { path: '/' });
  } catch (e) {}
  return res.json({ success: true, message: 'Logged out successfully.' });
};
