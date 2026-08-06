const mongoose = require('mongoose');
const Member = require('../models/Member');

// Get all members with search and role/team/accountType filter
exports.getMembers = async (req, res) => {
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
    
    if (role && role !== 'All') {
      if (role === 'Visitors') {
        query.$or = [
          { accountType: { $regex: /^visitor$/i } },
          { role: { $regex: /^visitor$/i } }
        ];
      } else if (role === 'Members') {
        query.accountType = { $regex: /^member$/i };
      } else if (role === 'Leads') {
        query.role = { $regex: /lead/i };
      } else if (role === 'Campus Ambassadors') {
        query.role = { $regex: /ambassador/i };
      } else if (role === 'Campus Mantri') {
        query.role = { $regex: /mantri/i };
      } else if (role === 'Faculty') {
        query.role = { $regex: /faculty/i };
      } else if (role === 'Inactive') {
        query.$or = [
          { status: 'Inactive' },
          { membershipStatus: 'suspended' },
          { membershipStatus: 'revoked' }
        ];
      } else {
        query.role = role;
      }
    }

    if (status && status !== 'All') {
      if (status === 'pending') {
        query.membershipStatus = { $regex: /^pending$/i };
      } else {
        query.status = status;
      }
    }

    if (accountType && accountType !== 'All') {
      query.accountType = { $regex: new RegExp(`^${accountType}$`, 'i') };
    }

    if (mongoose.connection.readyState === 1) {
      const members = await Member.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: members.length, data: members });
    } else {
      console.warn('[Member Controller]: DB not connected, returning empty array');
      return res.json({ success: true, count: 0, data: [] });
    }
  } catch (error) {
    console.error('[Member Controller Error]:', error);
    return res.status(500).json({ success: false, message: error.message, data: [] });
  }
};

// Create member
exports.createMember = async (req, res) => {
  try {
    const memberData = {
      communityId: 'gfg-jamia-hamdard',
      accountType: req.body.accountType || 'Visitor',
      role: req.body.role || 'Visitor',
      membershipStatus: req.body.membershipStatus || 'pending',
      ...req.body
    };

    const member = await Member.create(memberData);
    req.app.get('io')?.emit('admin:member-created', { member });
    return res.status(201).json({ success: true, data: member });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Update member (Admin full access)
exports.updateMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    req.app.get('io')?.emit('admin:member-updated', { member });
    return res.json({ success: true, data: member });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Change Membership & Official Role (Visitor -> Member promotion handler)
exports.updateMembership = async (req, res) => {
  const { id } = req.params;
  const { accountType, role, membershipStatus, session, teamName } = req.body;

  try {
    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (accountType) member.accountType = accountType;
    if (role) member.role = role;
    if (membershipStatus) member.membershipStatus = membershipStatus;
    if (session) member.session = session;
    if (teamName) member.teamName = teamName;

    // Auto generate Member ID if promoted to official Member
    if ((accountType === 'Member' || accountType === 'member') && !member.membershipId) {
      const count = await Member.countDocuments({ accountType: { $regex: /^member$/i } });
      member.membershipId = `GFG-JH-2026-${String(count + 1).padStart(3, '0')}`;
      member.verificationId = `v_${member._id}_${Date.now()}`;
      member.issueDate = new Date();
    }

    await member.save();

    // Emit real-time invalidation event
    req.app.get('io')?.emit('admin:member-updated', { member });

    return res.json({ success: true, data: member, message: 'Membership status and official role updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update Member Status (Suspend / Revoke / Restore)
exports.updateMemberStatus = async (req, res) => {
  const { id } = req.params;
  const { status, membershipStatus } = req.body;

  try {
    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (status) member.status = status;
    if (membershipStatus) member.membershipStatus = membershipStatus;

    await member.save();
    req.app.get('io')?.emit('admin:member-updated', { member });
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
        verifiedAt: new Date(member.createdAt || Date.now()).toLocaleDateString()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    req.app.get('io')?.emit('admin:member-updated', { memberId: req.params.id });
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

    req.app.get('io')?.emit('admin:member-created', { count: inserted.length });
    return res.json({ success: true, count: inserted.length, message: `Successfully imported ${inserted.length} members` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
