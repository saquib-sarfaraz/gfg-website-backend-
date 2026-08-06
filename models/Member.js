const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  photo: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
  coverPhoto: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  about: { type: String, default: '' },
  teamName: { type: String, default: 'Technical' }, // General team category
  role: { type: String, default: 'Member' }, // Official role (Admin-managed)
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  instagram: { type: String, default: '' },
  website: { type: String, default: '' },
  skills: [{ type: String }],
  expertise: [{ type: String }],
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Alumni', 'Inactive', 'Suspended', 'Revoked'], default: 'Active' },
  accountType: { type: String, enum: ['Visitor', 'Member'], default: 'Visitor' },
  membershipId: { type: String, sparse: true },
  membershipStatus: { type: String, enum: ['active', 'pending', 'inactive', 'expired', 'suspended', 'revoked'], default: 'pending' },
  verificationId: { type: String, sparse: true, index: true },
  session: { type: String, default: '2026–27' },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);
