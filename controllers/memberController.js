const mongoose = require('mongoose');
const Member = require('../models/Member');

const MOCK_MEMBERS = [
  {
    _id: 'm_saquib',
    name: 'Saquib Sarfaraz',
    email: 'saquib.mantri@gfgcampus.org',
    role: 'Campus Mantri',
    teamName: 'Executive Chapter',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    accountType: 'Member',
    membershipStatus: 'active',
    membershipId: 'GFG-JH-2026-001',
    session: '2026–27',
    createdAt: new Date('2026-07-01')
  },
  {
    _id: 'm_aisha',
    name: 'Aisha Khan',
    email: 'aisha.tech@gfgcampus.org',
    role: 'Technical Lead',
    teamName: 'Technical Chapter',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    accountType: 'Member',
    membershipStatus: 'active',
    membershipId: 'GFG-JH-2026-002',
    session: '2026–27',
    createdAt: new Date('2026-07-10')
  },
  {
    _id: 'm_ahmed',
    name: 'Ahmed Hassan',
    email: 'ahmed.visitor@gmail.com',
    role: 'Visitor',
    teamName: 'General',
    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    accountType: 'Visitor',
    membershipStatus: 'pending',
    session: '2026–27',
    createdAt: new Date('2026-08-05')
  }
];

// Get all members with search and role/team/accountType filter
exports.getMembers = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, count: MOCK_MEMBERS.length, data: MOCK_MEMBERS });
  }

  try {
    const { search, team, role, status, accountType } = req.query;
    const query = { communityId: 'gfg-jamia-hamdard' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { membershipId: { $regex: search, $options: 'i' } }
      ];
    }

    if (team && team !== 'All') query.teamName = team;
    if (role && role !== 'All') query.role = role;
    if (status && status !== 'All') query.status = status;
    if (accountType && accountType !== 'All') query.accountType = accountType;

    const members = await Member.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: members.length, data: members.length > 0 ? members : MOCK_MEMBERS });
  } catch (error) {
    return res.json({ success: true, count: MOCK_MEMBERS.length, data: MOCK_MEMBERS });
  }
};

// Create member
exports.createMember = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const newDoc = {
      _id: `m_${Date.now()}`,
      accountType: 'Visitor',
      membershipStatus: 'pending',
      ...req.body,
      createdAt: new Date()
    };
    MOCK_MEMBERS.unshift(newDoc);
    return res.status(201).json({ success: true, data: newDoc });
  }

  try {
    const member = await Member.create(req.body);
    return res.status(201).json({ success: true, data: member });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Update member (Admin full access)
exports.updateMember = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_MEMBERS.findIndex(m => m._id === req.params.id);
    if (idx !== -1) {
      MOCK_MEMBERS[idx] = { ...MOCK_MEMBERS[idx], ...req.body };
      return res.json({ success: true, data: MOCK_MEMBERS[idx] });
    }
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    return res.json({ success: true, data: member });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Change Membership & Official Role (Visitor -> Member promotion handler)
exports.updateMembership = async (req, res) => {
  const { id } = req.params;
  const { accountType, role, membershipStatus, session, teamName } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const m = MOCK_MEMBERS.find(item => item._id === id);
    if (m) {
      if (accountType) m.accountType = accountType;
      if (role) m.role = role;
      if (membershipStatus) m.membershipStatus = membershipStatus;
      if (session) m.session = session;
      if (teamName) m.teamName = teamName;
      if (accountType === 'Member' && !m.membershipId) {
        m.membershipId = `GFG-JH-2026-${String(MOCK_MEMBERS.length + 1).padStart(3, '0')}`;
      }
      return res.json({ success: true, data: m, message: 'Membership updated successfully' });
    }
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  try {
    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (accountType) member.accountType = accountType;
    if (role) member.role = role;
    if (membershipStatus) member.membershipStatus = membershipStatus;
    if (session) member.session = session;
    if (teamName) member.teamName = teamName;

    // Auto generate Member ID if promoted to official Member
    if (accountType === 'Member' && !member.membershipId) {
      const count = await Member.countDocuments({ accountType: 'Member' });
      member.membershipId = `GFG-JH-2026-${String(count + 1).padStart(3, '0')}`;
      member.verificationId = `v_${member._id}_${Date.now()}`;
      member.issueDate = new Date();
    }

    await member.save();
    return res.json({ success: true, data: member, message: 'Membership status and official role updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update Member Status (Suspend / Revoke / Restore)
exports.updateMemberStatus = async (req, res) => {
  const { id } = req.params;
  const { status, membershipStatus } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const m = MOCK_MEMBERS.find(item => item._id === id);
    if (m) {
      if (status) m.status = status;
      if (membershipStatus) m.membershipStatus = membershipStatus;
      return res.json({ success: true, data: m, message: `Member status updated to ${status}` });
    }
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  try {
    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (status) member.status = status;
    if (membershipStatus) member.membershipStatus = membershipStatus;

    await member.save();
    return res.json({ success: true, data: member, message: `Member status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Member self profile update
exports.updateSelfProfile = async (req, res) => {
  const memberId = req.params.id || req.body.memberId;
  const {
    photo, coverPhoto, bio, about, skills, expertise,
    github, linkedin, portfolio, instagram, website
  } = req.body;

  const allowedUpdates = {
    ...(photo !== undefined && { photo }),
    ...(coverPhoto !== undefined && { coverPhoto }),
    ...(bio !== undefined && { bio }),
    ...(about !== undefined && { about }),
    ...(skills !== undefined && { skills }),
    ...(expertise !== undefined && { expertise }),
    ...(github !== undefined && { github }),
    ...(linkedin !== undefined && { linkedin }),
    ...(portfolio !== undefined && { portfolio }),
    ...(instagram !== undefined && { instagram }),
    ...(website !== undefined && { website })
  };

  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      data: {
        _id: memberId || 'm_saquib',
        name: 'Saquib Sarfaraz',
        email: 'saquib.mantri@gfgcampus.org',
        role: 'Campus Mantri',
        teamName: 'Executive Chapter',
        photo: photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        accountType: 'Member',
        membershipStatus: 'active',
        membershipId: 'GFG-JH-2026-001'
      }
    });
  }

  try {
    const updated = await Member.findByIdAndUpdate(memberId, allowedUpdates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Member profile not found' });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Get single member profile
exports.getProfile = async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const m = MOCK_MEMBERS.find(item => item._id === id) || MOCK_MEMBERS[0];
    return res.json({ success: true, data: m });
  }

  try {
    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member profile not found' });
    return res.json({ success: true, data: member });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Verify Member DTO
exports.verifyMember = async (req, res) => {
  const { verificationId } = req.params;
  const mockDTO = {
    name: 'Saquib Sarfaraz',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    role: 'Campus Mantri',
    teamName: 'Executive Chapter',
    chapter: 'GeeksforGeeks Jamia Hamdard',
    membershipId: 'GFG-JH-2026-001',
    membershipStatus: 'active',
    session: '2026–27',
    verifiedAt: new Date().toLocaleDateString()
  };

  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return res.json({ success: true, data: mockDTO });
  }

  try {
    const query = {
      $or: [
        { verificationId },
        { membershipId: verificationId }
      ]
    };
    if (mongoose.Types.ObjectId.isValid(verificationId)) {
      query.$or.push({ _id: verificationId });
    }

    const member = await Member.findOne(query);
    if (!member) return res.status(404).json({ success: false, message: 'Verification badge not found' });

    return res.json({
      success: true,
      data: {
        name: member.name,
        photo: member.photo,
        role: member.role,
        teamName: member.teamName,
        chapter: 'GeeksforGeeks Jamia Hamdard',
        membershipId: member.membershipId || 'GFG-JH-2026-001',
        membershipStatus: member.membershipStatus || 'active',
        session: member.session || '2026–27',
        verifiedAt: new Date().toLocaleDateString()
      }
    });
  } catch (error) {
    return res.json({ success: true, data: mockDTO });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_MEMBERS.findIndex(m => m._id === req.params.id);
    if (idx !== -1) MOCK_MEMBERS.splice(idx, 1);
    return res.json({ success: true, message: 'Member removed successfully' });
  }

  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    return res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// CSV Import handler
exports.importCSV = async (req, res) => {
  try {
    const { membersList } = req.body;
    if (!Array.isArray(membersList) || membersList.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty members list array' });
    }

    const inserted = await Member.insertMany(membersList.map(m => ({
      ...m,
      communityId: 'gfg-jamia-hamdard'
    })));

    return res.json({ success: true, count: inserted.length, message: `Successfully imported ${inserted.length} members` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
