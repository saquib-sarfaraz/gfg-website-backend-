const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Member = require('../models/Member');

// Explicit recovery targets (production safety: only targeted accounts)
const RECOVERY_TARGETS = [
  'shshshh@gmail.com',
  'admin@gfgcampus.org',
  'saquibsarfaraz47@gmail.com'
];

const restoreMissingMembers = async () => {
  const isApply = process.argv.includes('--apply');
  const isDryRun = process.argv.includes('--dry-run') || !isApply;

  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
    console.log(`[Recovery Script] Connecting to MongoDB (${isDryRun ? 'DRY-RUN MODE' : 'APPLY MODE'})...`);
    await mongoose.connect(connStr);
    console.log('[Recovery Script] Connected to MongoDB.\n');

    console.log('==================================================');
    console.log(` MEMBER RECOVERY ${isDryRun ? 'DRY RUN (READ ONLY)' : 'APPLY (EXECUTING WRITES)'}`);
    console.log('==================================================');

    const totalUsers = await User.countDocuments({});
    const totalMembers = await Member.countDocuments({});
    console.log(`Total Users in DB: ${totalUsers}`);
    console.log(`Total Members in DB: ${totalMembers}\n`);

    for (const targetEmail of RECOVERY_TARGETS) {
      const user = await User.findOne({ email: targetEmail.toLowerCase() });
      if (!user) {
        console.log(`Account: ${targetEmail}`);
        console.log(`Status:  USER RECORD NOT FOUND IN DB`);
        console.log(`Action:  SKIP\n`);
        continue;
      }

      // Check if Member record exists by userRef, email, or memberRef
      let member = user.memberRef ? await Member.findById(user.memberRef) : null;
      if (!member) {
        member = await Member.findOne({ userRef: user._id });
      }
      if (!member) {
        member = await Member.findOne({ email: user.email.toLowerCase() });
      }

      console.log(`Account: ${user.email}`);
      console.log(`User ID: ${user._id}`);
      console.log(`Member: ${member ? `EXISTS (Member ID: ${member._id})` : 'MISSING'}`);

      if (member) {
        console.log(`Action:  SKIP (Member record already linked)\n`);
        continue;
      }

      console.log(`Action:  CREATE MISSING MEMBER (Role: Visitor, AccountType: Member, Status: Active)`);

      if (isDryRun) {
        console.log(`Result:  [DRY-RUN] No database changes performed.\n`);
      } else {
        // Create exact missing Member profile
        const newMember = await Member.create({
          communityId: 'gfg-jamia-hamdard',
          userCode: user.userCode,
          name: user.username || (user.email ? user.email.split('@')[0] : 'Community User'),
          email: user.email.toLowerCase(),
          phone: user.phone || '',
          teamName: 'General',
          role: 'Visitor',
          accountType: 'Member',
          membershipStatus: 'active',
          status: 'Active',
          userRef: user._id,
          photo: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=2f9e44&color=fff&bold=true`,
          about: user.collegeName ? `Student at ${user.collegeName}. Joined GFG Campus Community.` : 'Joined GFG Campus Community.',
          session: '2026–27',
          college: user.collegeName || 'Jamia Hamdard',
          department: user.course || 'Computer Science & Engineering'
        });

        // Link user.memberRef to newMember._id
        user.memberRef = newMember._id;
        await user.save();

        console.log(`Result:  ✓ RESTORED & LINKED SUCCESSFULLY (Member ID: ${newMember._id})\n`);
      }
    }

    console.log('==================================================');
    if (isDryRun) {
      console.log(' DRY RUN COMPLETE: 0 database writes were performed.');
      console.log(' To apply changes, run: node scripts/restore_missing_members.js --apply');
    } else {
      console.log(' APPLY COMPLETE: Missing member profiles restored safely.');
    }
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ [Recovery Script Error]:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Recovery Script] Disconnected from MongoDB.');
  }
};

restoreMissingMembers();
