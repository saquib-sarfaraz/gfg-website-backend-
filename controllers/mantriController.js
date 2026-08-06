const CampusMantri = require('../models/CampusMantri');

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
    if (req.body.isCurrent) {
      // Reset previous current mantri
      await CampusMantri.updateMany({ communityId: 'gfg-jamia-hamdard' }, { isCurrent: false });
    }
    const item = await CampusMantri.create(req.body);
    const populated = await CampusMantri.findById(item._id).populate('memberRef');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateMantri = async (req, res) => {
  try {
    if (req.body.isCurrent) {
      await CampusMantri.updateMany({ communityId: 'gfg-jamia-hamdard', _id: { $ne: req.params.id } }, { isCurrent: false });
    }
    const item = await CampusMantri.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('memberRef');
    if (!item) return res.status(404).json({ success: false, message: 'Campus Mantri record not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
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
