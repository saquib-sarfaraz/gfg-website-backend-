const Team = require('../models/Team');

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ communityId: 'gfg-jamia-hamdard' })
      .populate({ path: 'leadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'coLeadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'memberRefs', populate: { path: 'userRef', select: 'username email avatar' } })
      .sort({ displayOrder: 1 });

    // Ensure team memberRefs are sorted alphabetically A-Z
    teams.forEach(t => {
      if (Array.isArray(t.memberRefs) && t.memberRefs.length > 1) {
        t.memberRefs.sort((a, b) => {
          const nameA = (a.name || a.userRef?.username || '').toLowerCase();
          const nameB = (b.name || b.userRef?.username || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      }
    });

    return res.json({ success: true, data: teams });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data._id || typeof data._id === 'string' && data._id.trim() === '') {
      delete data._id;
    }
    const team = await Team.create(data);
    const populated = await Team.findById(team._id)
      .populate({ path: 'leadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'coLeadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'memberRefs', populate: { path: 'userRef', select: 'username email avatar' } });
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[createTeam Error]:', err);
    return res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data._id) delete data._id;
    const team = await Team.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate({ path: 'leadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'coLeadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'memberRefs', populate: { path: 'userRef', select: 'username email avatar' } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    return res.json({ success: true, data: team });
  } catch (err) {
    console.error('[updateTeam Error]:', err);
    return res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Team deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.assignMember = async (req, res) => {
  const { id } = req.params;
  const { memberId, role } = req.body;

  if (!memberId) {
    return res.status(400).json({ success: false, message: 'memberId is required' });
  }

  try {
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const isCommunityLeadTeam = team.name && team.name.toLowerCase().includes('community');

    // Community Lead validation: strictly 1 Lead only, no Co-Lead or Member
    if (isCommunityLeadTeam && role !== 'Lead') {
      return res.status(400).json({
        success: false,
        message: 'The Community Lead team only supports the Team Lead role.'
      });
    }

    if (role === 'Lead') {
      if (team.leadRef && String(team.leadRef) === String(memberId)) {
        return res.status(400).json({ success: false, message: 'This member is already assigned as Lead of this team.' });
      }
      team.leadRef = memberId;
    } else if (role === 'Co-Lead') {
      if (team.coLeadRef && String(team.coLeadRef) === String(memberId)) {
        return res.status(400).json({ success: false, message: 'This member is already assigned as Co-Lead of this team.' });
      }
      team.coLeadRef = memberId;
    } else {
      // Member role
      if (!Array.isArray(team.memberRefs)) {
        team.memberRefs = [];
      }
      const alreadyInTeam = team.memberRefs.some(m => String(m) === String(memberId));
      if (alreadyInTeam) {
        return res.status(400).json({ success: false, message: 'This member is already assigned to this team.' });
      }
      team.memberRefs.push(memberId);
    }

    await team.save();
    const populated = await Team.findById(team._id)
      .populate({ path: 'leadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'coLeadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'memberRefs', populate: { path: 'userRef', select: 'username email avatar' } });

    return res.json({ success: true, data: populated, message: `Assigned as ${role} successfully` });
  } catch (err) {
    console.error('[assignMember Error]:', err);
    return res.status(500).json({ success: false, message: err.message, error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  const { id } = req.params;
  const { memberId, role } = req.body;

  try {
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (role === 'Lead') {
      team.leadRef = null;
    } else if (role === 'Co-Lead') {
      team.coLeadRef = null;
    } else {
      // Member role: pull from memberRefs
      if (Array.isArray(team.memberRefs)) {
        team.memberRefs = team.memberRefs.filter(m => String(m) !== String(memberId));
      }
    }

    await team.save();
    const populated = await Team.findById(team._id)
      .populate({ path: 'leadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'coLeadRef', populate: { path: 'userRef', select: 'username email avatar' } })
      .populate({ path: 'memberRefs', populate: { path: 'userRef', select: 'username email avatar' } });

    return res.json({ success: true, data: populated, message: `Removed ${role} assignment successfully` });
  } catch (err) {
    console.error('[removeMember Error]:', err);
    return res.status(500).json({ success: false, message: err.message, error: err.message });
  }
};
