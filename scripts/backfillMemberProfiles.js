const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Member = require('../models/Member');

const backfillMemberProfiles = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
    console.log('[Backfill] Connecting to MongoDB...');
    await mongoose.connect(connStr);
    console.log('[Backfill] Connected to MongoDB!');

    const users = await User.find({}).populate('memberRef');
    console.log(`[Backfill] Found ${users.length} total User accounts. Checking for missing Member profiles...`);

    let createdCount = 0;
    let linkedCount = 0;

    for (const user of users) {
      // 1. Try finding linked member or member by email
      let member = user.memberRef;
      if (!member && user.email) {
        member = await Member.findOne({ email: user.email.toLowerCase() });
      }

      if (!member) {
        // Create missing Member profile
        const isOfficialAdmin = user.role === 'Super Admin' || user.role === 'Admin' || user.role === 'Campus Mantri';
        const accountType = isOfficialAdmin ? 'Member' : 'Visitor';
        const officialRole = user.role || 'Visitor';
        const membershipStatus = isOfficialAdmin ? 'active' : 'pending';

        member = await Member.create({
          communityId: 'gfg-jamia-hamdard',
          name: user.username || 'Community User',
          email: user.email ? user.email.toLowerCase() : `user_${user._id}@gfgcampus.org`,
          phone: user.phone || '',
          teamName: isOfficialAdmin ? 'Executive Chapter' : 'General',
          role: officialRole,
          accountType,
          membershipStatus,
          userRef: user._id,
          photo: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=2f9e44&color=fff&bold=true`,
          about: user.collegeName ? `Student at ${user.collegeName}.` : 'Joined GFG Campus Community.',
          session: '2026–27'
        });

        createdCount++;
        console.log(`[Backfill] Created missing Member profile for user ${user.email} (Type: ${accountType}, Role: ${officialRole})`);
      }

      // Ensure bidirectional userRef <-> memberRef link
      if (!user.memberRef || user.memberRef.toString() !== member._id.toString()) {
        user.memberRef = member._id;
        await user.save();
        linkedCount++;
      }

      if (!member.userRef || member.userRef.toString() !== user._id.toString()) {
        member.userRef = user._id;
        await member.save();
      }
    }

    console.log(`====================================================`);
    console.log(`✓ Backfill complete: ${createdCount} Member profiles created, ${linkedCount} User-Member links updated.`);
    console.log(`====================================================`);

  } catch (err) {
    console.error('[Backfill Error]:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Backfill] Disconnected from MongoDB.');
  }
};

backfillMemberProfiles();
