const mongoose = require('mongoose');

const campusMantriSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  memberRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  session: { type: String, required: true }, // e.g. "2025-2026"
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  about: { type: String, required: true },
  achievements: [{ type: String }],
  techStack: [{ type: String }],
  isCurrent: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('CampusMantri', campusMantriSchema);
