const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  authorRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  content: { type: String, required: true },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
  likesCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  moderationStatus: {
    type: String,
    enum: ['clean', 'flagged', 'under_review', 'hidden', 'removed'],
    default: 'clean',
    index: true
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }
}, { timestamps: true });

commentSchema.index({ moderationStatus: 1, reportCount: -1 });

module.exports = mongoose.model('Comment', commentSchema);
