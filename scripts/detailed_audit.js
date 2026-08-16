const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Member = require('../models/Member');
const User = require('../models/User');
const Team = require('../models/Team');
const CampusMantri = require('../models/CampusMantri');

async function detailedAudit() {
  const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
  await mongoose.connect(connStr);

  const members = await Member.find({}).sort({ membershipId: 1, name: 1 }).lean();
  const users = await User.find({}).lean();

  console.log('--- ALL MEMBERS AUDIT ---');
  members.forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.membershipId || 'NO_MEMBER_ID'}] ${m.name} | Email: ${m.email} | Role: ${m.role} | userCode: ${m.userCode} | userRef: ${m.userRef ? m.userRef : 'NONE'} | ID: ${m._id}`);
  });

  console.log('\n--- ALL USERS AUDIT ---');
  users.forEach((u, idx) => {
    console.log(`${idx + 1}. [${u.userCode}] ${u.username} | Email: ${u.email} | Role: ${u.role} | memberRef: ${u.memberRef ? u.memberRef : 'NONE'} | ID: ${u._id}`);
  });

  await mongoose.disconnect();
}

detailedAudit().catch(console.error);
