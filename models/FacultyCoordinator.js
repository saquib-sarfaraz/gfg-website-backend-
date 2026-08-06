const mongoose = require('mongoose');

const facultyCoordinatorSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  memberRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  designation: { type: String, required: true }, // e.g. Associate Professor, HOD CS
  department: { type: String, required: true }, // e.g. Dept. of Computer Science
  displayOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('FacultyCoordinator', facultyCoordinatorSchema);
