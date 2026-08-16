const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Member = require('../models/Member');
const User = require('../models/User');
const Team = require('../models/Team');
const CampusMantri = require('../models/CampusMantri');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');

async function runAudit() {
  const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
  console.log(`Connecting to DB...`);
  await mongoose.connect(connStr);
  console.log(`Connected successfully.\n`);

  console.log('====================================================');
  console.log('           READ-ONLY PRODUCTION AUDIT              ');
  console.log('====================================================\n');

  // 1. Fetch all records
  const allMembers = await Member.find({}).lean();
  const allUsers = await User.find({}).lean();
  const allTeams = await Team.find({}).lean();
  const allMantris = await CampusMantri.find({}).lean();

  console.log(`Total Members in DB: ${allMembers.length}`);
  console.log(`Total Users in DB: ${allUsers.length}`);
  console.log(`Total Teams in DB: ${allTeams.length}`);
  console.log(`Total Campus Mantris in DB: ${allMantris.length}\n`);

  // 2. Audit Specific Cases: Kashish Safia
  console.log('--- 1. AUDIT: KASHISH SAFIA ---');
  const kashishMembers = allMembers.filter(m => 
    (m.name && m.name.toLowerCase().includes('kashish')) || 
    (m.email && m.email.toLowerCase().includes('kashish'))
  );
  console.log(`Found ${kashishMembers.length} Member record(s) for Kashish:`);
  kashishMembers.forEach(m => {
    console.log({
      _id: m._id,
      membershipId: m.membershipId,
      userCode: m.userCode,
      name: m.name,
      email: m.email,
      role: m.role,
      teamName: m.teamName,
      status: m.status,
      accountType: m.accountType,
      membershipStatus: m.membershipStatus,
      bio: m.bio,
      about: m.about,
      photo: m.photo,
      github: m.github,
      linkedin: m.linkedin,
      instagram: m.instagram,
      website: m.website,
      userRef: m.userRef,
      createdAt: m.createdAt
    });
  });

  const kashishUsers = allUsers.filter(u => 
    (u.username && u.username.toLowerCase().includes('kashish')) || 
    (u.email && u.email.toLowerCase().includes('kashish'))
  );
  console.log(`\nFound ${kashishUsers.length} User record(s) for Kashish:`);
  kashishUsers.forEach(u => {
    console.log({
      _id: u._id,
      userCode: u.userCode,
      username: u.username,
      email: u.email,
      role: u.role,
      memberRef: u.memberRef,
      avatar: u.avatar
    });
  });

  // 3. Audit Specific Cases: Rida Fatima Tanveer
  console.log('\n--- 2. AUDIT: RIDA FATIMA TANVEER ---');
  const ridaMembers = allMembers.filter(m => 
    (m.name && m.name.toLowerCase().includes('rida')) || 
    (m.email && m.email.toLowerCase().includes('rida'))
  );
  console.log(`Found ${ridaMembers.length} Member record(s) for Rida:`);
  ridaMembers.forEach(m => {
    console.log({
      _id: m._id,
      membershipId: m.membershipId,
      userCode: m.userCode,
      name: m.name,
      email: m.email,
      role: m.role,
      teamName: m.teamName,
      status: m.status,
      accountType: m.accountType,
      membershipStatus: m.membershipStatus,
      bio: m.bio,
      about: m.about,
      photo: m.photo,
      github: m.github,
      linkedin: m.linkedin,
      instagram: m.instagram,
      website: m.website,
      userRef: m.userRef,
      createdAt: m.createdAt
    });
  });

  const ridaUsers = allUsers.filter(u => 
    (u.username && u.username.toLowerCase().includes('rida')) || 
    (u.email && u.email.toLowerCase().includes('rida'))
  );
  console.log(`\nFound ${ridaUsers.length} User record(s) for Rida:`);
  ridaUsers.forEach(u => {
    console.log({
      _id: u._id,
      userCode: u.userCode,
      username: u.username,
      email: u.email,
      role: u.role,
      memberRef: u.memberRef,
      avatar: u.avatar
    });
  });

  // 4. Global Duplicate Scan across ALL members
  console.log('\n--- 3. GLOBAL DUPLICATE SCAN ACROSS ALL MEMBERS ---');
  // Group by normalized name
  const nameGroups = {};
  allMembers.forEach(m => {
    const norm = (m.name || '').trim().toLowerCase();
    if (!nameGroups[norm]) nameGroups[norm] = [];
    nameGroups[norm].push(m);
  });

  // Group by normalized email prefix / domain
  const emailGroups = {};
  allMembers.forEach(m => {
    const norm = (m.email || '').trim().toLowerCase();
    if (!emailGroups[norm]) emailGroups[norm] = [];
    emailGroups[norm].push(m);
  });

  // Group by userRef
  const userRefGroups = {};
  allMembers.forEach(m => {
    if (m.userRef) {
      const uRef = String(m.userRef);
      if (!userRefGroups[uRef]) userRefGroups[uRef] = [];
      userRefGroups[uRef].push(m);
    }
  });

  console.log('Duplicates by Name:');
  let duplicateCount = 0;
  for (const [name, list] of Object.entries(nameGroups)) {
    if (list.length > 1) {
      duplicateCount++;
      console.log(`\n[Duplicate Name Group]: "${name}" (${list.length} records)`);
      list.forEach(m => {
        console.log(`  - ID: ${m._id} | membershipId: ${m.membershipId} | userCode: ${m.userCode} | email: ${m.email} | role: ${m.role} | userRef: ${m.userRef}`);
      });
    }
  }
  if (duplicateCount === 0) console.log('None found.');

  console.log('\nDuplicates by Email:');
  let dupEmailCount = 0;
  for (const [email, list] of Object.entries(emailGroups)) {
    if (list.length > 1) {
      dupEmailCount++;
      console.log(`\n[Duplicate Email Group]: "${email}" (${list.length} records)`);
      list.forEach(m => {
        console.log(`  - ID: ${m._id} | membershipId: ${m.membershipId} | userCode: ${m.userCode} | name: ${m.name} | role: ${m.role}`);
      });
    }
  }
  if (dupEmailCount === 0) console.log('None found.');

  console.log('\nDuplicates by userRef:');
  let dupUserRefCount = 0;
  for (const [uRef, list] of Object.entries(userRefGroups)) {
    if (list.length > 1) {
      dupUserRefCount++;
      console.log(`\n[Duplicate userRef Group]: "${uRef}" (${list.length} records)`);
      list.forEach(m => {
        console.log(`  - ID: ${m._id} | membershipId: ${m.membershipId} | name: ${m.name} | email: ${m.email}`);
      });
    }
  }
  if (dupUserRefCount === 0) console.log('None found.');

  // 5. Team References Inspection
  console.log('\n--- 4. TEAM REFERENCES INSPECTION ---');
  allTeams.forEach(t => {
    console.log(`Team: ${t.name} (_id: ${t._id})`);
    console.log(`  leadRef: ${t.leadRef}`);
    console.log(`  coLeadRef: ${t.coLeadRef}`);
    console.log(`  memberRefs: ${JSON.stringify(t.memberRefs)}`);
  });

  // 6. Campus Mantri References Inspection
  console.log('\n--- 5. CAMPUS MANTRI REFERENCES INSPECTION ---');
  allMantris.forEach(cm => {
    console.log(`Campus Mantri: session=${cm.session}, isCurrent=${cm.isCurrent}, memberRef=${cm.memberRef}`);
  });

  // 7. Activity references inspection
  console.log('\n--- 6. ACTIVITY / POSTS INSPECTION ---');
  const postCount = await Post.countDocuments();
  const commentCount = await Comment.countDocuments();
  const likeCount = await Like.countDocuments();
  const bookmarkCount = await Bookmark.countDocuments();
  console.log(`Activity Counts: Posts=${postCount}, Comments=${commentCount}, Likes=${likeCount}, Bookmarks=${bookmarkCount}`);

  await mongoose.disconnect();
  console.log('\nAudit Completed successfully.');
}

runAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
