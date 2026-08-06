const Team = require('../models/Team');

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ communityId: 'gfg-jamia-hamdard' })
      .populate('leadRef')
      .populate('coLeadRef')
      .populate('memberRefs')
      .sort({ displayOrder: 1 });
    return res.json({ success: true, data: teams });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const team = await Team.create(req.body);
    const populated = await Team.findById(team._id)
      .populate('leadRef')
      .populate('coLeadRef')
      .populate('memberRefs');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('leadRef')
      .populate('coLeadRef')
      .populate('memberRefs');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    return res.json({ success: true, data: team });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
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
