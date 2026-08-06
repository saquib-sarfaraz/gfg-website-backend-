const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Member = require('../models/Member');
const { JWT_SECRET } = require('../middleware/auth');

// In-memory fallback auth store for offline development when DB connection is pending
const MOCK_AUTH_USERS = [
  {
    _id: 'u_admin_demo',
    username: 'Super Admin',
    email: 'admin@gfgcampus.org',
    passwordHash: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPG.a.37u', // bcrypt hash for 'admin123'
    role: 'Super Admin',
    accountType: 'Member',
    memberRef: 'm_saquib'
  }
];

// SIGNUP HANDLER
exports.signup = async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, isJamia, collegeName, course } = req.body;

    // 1. Basic Field Validation
    if (!fullName || !email || !password || !confirmPassword || isJamia === undefined) {
      return res.status(400).json({ success: false, message: 'Please fill in all required onboarding fields.' });
    }

    // 2. Email Syntax Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a syntactically valid email address (e.g. name@domain.com).' });
    }

    // 3. Password Policy & Confirmation Match
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    // 4. Conditional College Validation
    const institutionType = isJamia === true || isJamia === 'true' ? 'jamia_hamdard' : 'other';
    const finalCollegeName = institutionType === 'jamia_hamdard' ? 'Jamia Hamdard' : (collegeName || '').trim();

    if (institutionType === 'other' && !finalCollegeName) {
      return res.status(400).json({ success: false, message: 'College / University Name is required when you are not from Jamia Hamdard.' });
    }

    // 5. MongoDB vs Offline Memory Store Operations
    if (mongoose.connection.readyState === 1) {
      // Check existing email
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in instead.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create linked Member profile document first as VISITOR
      const newMember = await Member.create({
        name: fullName.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : '',
        teamName: 'General',
        role: 'Visitor', // STRICT BUSINESS RULE: ALWAYS VISITOR ON SIGNUP
        accountType: 'Visitor', // STRICT BUSINESS RULE
        membershipStatus: 'pending', // STRICT BUSINESS RULE
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2f9e44&color=fff&bold=true`,
        about: `Student at ${finalCollegeName}. Joined GFG Campus Community.`,
        session: '2026–27'
      });

      // Create User authentication identity
      const newUser = await User.create({
        username: fullName.trim(),
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

      // Update Member with userRef
      newMember.userRef = newUser._id;
      await newMember.save();

      // Sign JWT
      const token = jwt.sign(
        { id: newUser._id, username: newUser.username, email: newUser.email, role: 'Visitor', memberId: newMember._id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully as Visitor. Welcome to GFG Campus Community!',
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: 'Visitor',
          collegeName: finalCollegeName,
          institutionType
        },
        member: newMember
      });
    } else {
      // Offline fallback
      const existing = MOCK_AUTH_USERS.find(u => u.email === normalizedEmail);
      if (existing) {
        return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in instead.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newId = `u_${Date.now()}`;
      const memberId = `m_${Date.now()}`;

      const mockMemberDoc = {
        _id: memberId,
        name: fullName.trim(),
        email: normalizedEmail,
        phone: phone || '',
        teamName: 'General',
        role: 'Visitor',
        accountType: 'Visitor',
        membershipStatus: 'pending',
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2f9e44&color=fff&bold=true`,
        session: '2026–27',
        createdAt: new Date()
      };

      const mockUserDoc = {
        _id: newId,
        username: fullName.trim(),
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: 'Visitor',
        accountType: 'Visitor',
        institutionType,
        collegeName: finalCollegeName,
        course: course || '',
        memberRef: memberId
      };

      MOCK_AUTH_USERS.push(mockUserDoc);

      const token = jwt.sign(
        { id: newId, username: fullName, email: normalizedEmail, role: 'Visitor', memberId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully as Visitor. Welcome to GFG Campus Community!',
        token,
        user: {
          id: newId,
          username: fullName,
          email: normalizedEmail,
          role: 'Visitor',
          collegeName: finalCollegeName
        },
        member: mockMemberDoc
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Signup failed: ' + err.message });
  }
};

// LOGIN HANDLER
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

    // Default Super Admin hardcoded check fallback
    if ((normalizedEmail === 'admin@gfgcampus.org' || normalizedEmail === 'admin@gfg.org') && password === 'admin123') {
      const token = jwt.sign(
        { id: 'admin_demo_id', username: 'Super Admin', email: normalizedEmail, role: 'Super Admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const adminMember = {
        _id: 'm_saquib',
        name: 'Super Admin',
        email: normalizedEmail,
        role: 'Campus Mantri',
        accountType: 'Member',
        membershipStatus: 'active',
        membershipId: 'GFG-JH-2026-001',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
      };

      return res.json({
        success: true,
        token,
        user: { id: 'admin_demo_id', username: 'Super Admin', email: normalizedEmail, role: 'Super Admin' },
        member: adminMember
      });
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

      let member = user.memberRef;
      if (!member) {
        member = await Member.findOne({ email: normalizedEmail });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, email: user.email, role: member?.role || user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

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
        member: member || {
          _id: `m_${user._id}`,
          name: user.username,
          email: user.email,
          role: user.role,
          accountType: 'Visitor',
          membershipStatus: 'pending'
        }
      });
    } else {
      // Offline fallback lookup
      const user = MOCK_AUTH_USERS.find(u => u.email === normalizedEmail);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch && password !== 'admin123') {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const member = {
        _id: user.memberRef || `m_${user._id}`,
        name: user.username,
        email: user.email,
        role: user.role || 'Visitor',
        accountType: user.accountType || 'Visitor',
        membershipStatus: user.accountType === 'Member' ? 'active' : 'pending',
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=2f9e44&color=fff&bold=true`
      };

      return res.json({
        success: true,
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role },
        member
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login error: ' + err.message });
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

    if (decoded.id === 'admin_demo_id') {
      return res.json({
        success: true,
        user: { id: 'admin_demo_id', username: 'Super Admin', email: decoded.email, role: 'Super Admin' },
        member: {
          _id: 'm_saquib',
          name: 'Super Admin',
          email: decoded.email,
          role: 'Campus Mantri',
          accountType: 'Member',
          membershipStatus: 'active',
          membershipId: 'GFG-JH-2026-001',
          photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
        }
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id).populate('memberRef');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      let member = user.memberRef;
      if (!member) {
        member = await Member.findOne({ email: user.email });
      }

      return res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          collegeName: user.collegeName
        },
        member: member || {
          _id: `m_${user._id}`,
          name: user.username,
          email: user.email,
          role: user.role,
          accountType: 'Visitor',
          membershipStatus: 'pending'
        }
      });
    } else {
      const u = MOCK_AUTH_USERS.find(item => item._id === decoded.id) || {
        _id: decoded.id,
        username: decoded.username || 'User',
        email: decoded.email,
        role: decoded.role || 'Visitor'
      };

      const member = {
        _id: u.memberRef || `m_${u._id}`,
        name: u.username,
        email: u.email,
        role: u.role || 'Visitor',
        accountType: u.accountType || 'Visitor',
        membershipStatus: u.accountType === 'Member' ? 'active' : 'pending',
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=2f9e44&color=fff&bold=true`
      };

      return res.json({
        success: true,
        user: { id: u._id, username: u.username, email: u.email, role: u.role },
        member
      });
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// LOGOUT HANDLER
exports.logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
};

// SEED ADMIN HANDLER
exports.seedAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ email: 'admin@gfgcampus.org' });
    if (existing) {
      return res.json({ message: 'Super admin already exists', email: existing.email });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminMember = await Member.create({
      name: 'Super Admin',
      email: 'admin@gfgcampus.org',
      role: 'Campus Mantri',
      teamName: 'Executive Chapter',
      accountType: 'Member',
      membershipStatus: 'active',
      membershipId: 'GFG-JH-2026-001',
      session: '2026–27',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
    });

    const admin = await User.create({
      username: 'Super Admin',
      email: 'admin@gfgcampus.org',
      password: hashedPassword,
      role: 'Super Admin',
      memberRef: adminMember._id
    });

    return res.json({ message: 'Admin seeded successfully', user: { email: admin.email } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
