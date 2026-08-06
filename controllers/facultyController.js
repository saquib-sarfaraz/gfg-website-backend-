const FacultyCoordinator = require('../models/FacultyCoordinator');

exports.getCoordinators = async (req, res) => {
  try {
    const list = await FacultyCoordinator.find({ communityId: 'gfg-jamia-hamdard' })
      .populate('memberRef')
      .sort({ displayOrder: 1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createCoordinator = async (req, res) => {
  try {
    const item = await FacultyCoordinator.create(req.body);
    const populated = await FacultyCoordinator.findById(item._id).populate('memberRef');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateCoordinator = async (req, res) => {
  try {
    const item = await FacultyCoordinator.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('memberRef');
    if (!item) return res.status(404).json({ success: false, message: 'Faculty record not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteCoordinator = async (req, res) => {
  try {
    await FacultyCoordinator.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Faculty record deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
