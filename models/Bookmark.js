const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  memberRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  postRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true }
}, { timestamps: true });

bookmarkSchema.index({ memberRef: 1, postRef: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
