const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['Visitor', 'Member', 'Admin', 'Super Admin'], default: 'Visitor' },
  institutionType: { type: String, enum: ['jamia_hamdard', 'other'], default: 'jamia_hamdard' },
  collegeName: { type: String, default: 'Jamia Hamdard' },
  course: { type: String, default: '' },
  memberRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  avatar: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
