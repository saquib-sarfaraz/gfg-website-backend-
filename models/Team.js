const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  name: { type: String, required: true },
  icon: { type: String, default: 'Code2' }, // Lucide icon identifier
  description: { type: String, required: true },
  leadRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  coLeadRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  memberRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  displayOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
