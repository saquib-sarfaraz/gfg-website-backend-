/**
 * Bootstrap Root Super Admin Script
 * 
 * STRICT SECURITY REQUIREMENT:
 * ROOT_ADMIN_PASSWORD and ROOT_ADMIN_PIN must be provided as environment variables.
 * Fallback/default credentials are prohibited. If environment variables are missing,
 * this script exits with failure.
 * 
 * Usage:
 * ROOT_ADMIN_PASSWORD="YourStrongPassword" ROOT_ADMIN_PIN="123456" node scripts/bootstrapRootAdmin.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Member = require('../models/Member');
const AdminAccess = require('../models/AdminAccess');

const bootstrapRootAdmin = async () => {
  try {
    const rootEmail = (process.env.ROOT_ADMIN_EMAIL || 'admin@gfgcampus.org').trim().toLowerCase();
    const rootPassword = process.env.ROOT_ADMIN_PASSWORD;
    const rootPin = process.env.ROOT_ADMIN_PIN;

    // STRICT VALIDATION: Prohibit execution without explicit production credentials
    if (!rootPassword || !rootPin) {
      console.error('\n❌ [BOOTSTRAP ERROR]: Mandatory environment variables ROOT_ADMIN_PASSWORD and ROOT_ADMIN_PIN are missing.');
      console.error('For security reasons, fallback default credentials are prohibited.');
      console.error('Please specify ROOT_ADMIN_PASSWORD and ROOT_ADMIN_PIN in your .env or environment before running bootstrap.\n');
      process.exit(1);
    }

    if (String(rootPin).length < 4 || String(rootPin).length > 8) {
      console.error('❌ [BOOTSTRAP ERROR]: ROOT_ADMIN_PIN must be between 4 and 8 digits (6 digits recommended).');
      process.exit(1);
    }

    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
    console.log('[Bootstrap] Connecting to MongoDB...');
    await mongoose.connect(connStr);
    console.log('[Bootstrap] Connected to MongoDB.');

    // 1. Hash credentials
    const hashedPassword = await bcrypt.hash(rootPassword, 10);
    const hashedPin = await bcrypt.hash(String(rootPin), 10);

    // 2. Find or Create Member profile
    let member = await Member.findOne({ email: rootEmail });
    if (!member) {
      member = await Member.create({
        name: 'Root Super Admin',
        email: rootEmail,
        role: 'Campus Mantri', // Community identity remains independent
        accountType: 'Member',
        membershipStatus: 'active',
        membershipId: 'GFG-JH-ROOT-001',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        about: 'Root System Administrator for GFG Campus Community Platform.'
      });
      console.log('✓ Member profile created for Root Admin');
    }

    // 3. Find or Create User identity
    let user = await User.findOne({ email: rootEmail });
    if (!user) {
      user = await User.create({
        username: 'Root Super Admin',
        email: rootEmail,
        password: hashedPassword,
        role: 'Super Admin',
        memberRef: member._id,
        avatar: member.photo
      });
      console.log('✓ User identity created for Root Admin');
    } else {
      user.password = hashedPassword;
      user.memberRef = member._id;
      await user.save();
      console.log('✓ User password updated for Root Admin');
    }

    // Ensure Member points to User
    member.userRef = user._id;
    await member.save();

    // 4. Find or Create AdminAccess
    let adminAccess = await AdminAccess.findOne({ userRef: user._id });
    if (!adminAccess) {
      adminAccess = await AdminAccess.create({
        userRef: user._id,
        adminRole: 'ROOT_SUPER_ADMIN',
        permissions: ['manage_members', 'manage_events', 'manage_gallery', 'manage_resources', 'manage_admins', 'system_settings'],
        pinHash: hashedPin,
        status: 'Active',
        createdBy: user._id
      });
      console.log('✓ AdminAccess record created for Root Super Admin (ROOT_SUPER_ADMIN)');
    } else {
      adminAccess.adminRole = 'ROOT_SUPER_ADMIN';
      adminAccess.pinHash = hashedPin;
      adminAccess.status = 'Active';
      adminAccess.failedLoginAttempts = 0;
      adminAccess.lockedUntil = null;
      await adminAccess.save();
      console.log('✓ AdminAccess PIN and ROOT_SUPER_ADMIN role updated');
    }

    console.log('\n====================================================');
    console.log('✓ SUCCESS: Root Super Admin provisioned successfully.');
    console.log(`  Email: ${rootEmail}`);
    console.log('  Role:  ROOT_SUPER_ADMIN');
    console.log('  PIN:   [Configured securely via environment]');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ [Bootstrap Error]:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Bootstrap] Disconnected from MongoDB.');
  }
};

bootstrapRootAdmin();
