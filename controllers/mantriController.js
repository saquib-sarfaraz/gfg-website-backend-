const CampusMantri = require('../models/CampusMantri');
const Member = require('../models/Member');

exports.getMantris = async (req, res) => {
  try {
    const list = await CampusMantri.find({ communityId: 'gfg-jamia-hamdard' })
      .populate('memberRef')
      .sort({ startDate: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createMantri = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data._id || typeof data._id === 'string' && data._id.trim() === '') {
      delete data._id;
    }

    if (!data.memberRef) {
      return res.status(400).json({ success: false, message: 'Member reference (memberRef) is required' });
    }

    // Fallback about to member's bio if omitted or blank
    if (!data.about || data.about.trim() === '') {
      const member = await Member.findById(data.memberRef).lean();
      data.about = member?.bio || member?.about || 'Leading community initiatives and technical growth.';
    }

    if (!data.startDate) {
      data.startDate = new Date();
    }

    if (data.isCurrent) {
      // Reset previous current mantri
      await CampusMantri.updateMany({ communityId: 'gfg-jamia-hamdard' }, { isCurrent: false });
    }

    const item = await CampusMantri.create(data);
    const populated = await CampusMantri.findById(item._id).populate('memberRef');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[createMantri Error]:', err);
    return res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

exports.updateMantri = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data._id) delete data._id;

    if (data.isCurrent) {
      await CampusMantri.updateMany({ communityId: 'gfg-jamia-hamdard', _id: { $ne: req.params.id } }, { isCurrent: false });
    }

    // Fallback about to member's bio if blank
    if ((!data.about || data.about.trim() === '') && data.memberRef) {
      const member = await Member.findById(data.memberRef).lean();
      data.about = member?.bio || member?.about || 'Leading community initiatives and technical growth.';
    }

    const item = await CampusMantri.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('memberRef');
    if (!item) return res.status(404).json({ success: false, message: 'Campus Mantri record not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('[updateMantri Error]:', err);
    return res.status(400).json({ success: false, message: err.message, error: err.message });
  }
};

exports.setCurrentMantri = async (req, res) => {
  try {
    await CampusMantri.updateMany({ communityId: 'gfg-jamia-hamdard' }, { isCurrent: false });
    const item = await CampusMantri.findByIdAndUpdate(req.params.id, { isCurrent: true, status: 'Active' }, { new: true })
      .populate('memberRef');
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteMantri = async (req, res) => {
  try {
    await CampusMantri.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Campus Mantri record deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
