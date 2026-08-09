const mongoose = require('mongoose');

const postMediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'pdf'], required: true },
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  fileName: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  size: { type: Number, default: 0 },
  width: { type: Number },
  height: { type: Number }
}, { _id: true });

const postSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  authorRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  postType: {
    type: String,
    enum: ['Thought', 'Study Note', 'Image', 'Achievement', 'Question', 'Opportunity', 'Project'],
    default: 'Thought'
  },
  title: { type: String, default: '' },
  content: { type: String, required: true },
  media: [postMediaSchema],
  externalUrl: { type: String, default: '' },
  tags: [{ type: String }],
  likesCount: { type: Number, default: 0 },
  bookmarksCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  moderationStatus: {
    type: String,
    enum: ['clean', 'flagged', 'under_review', 'hidden', 'removed'],
    default: 'clean',
    index: true
  },
  isPinned: { type: Boolean, default: false },
  clientRequestId: { type: String, sparse: true, index: true },
  status: { type: String, enum: ['Active', 'Reported', 'Archived'], default: 'Active' }
}, { timestamps: true });

postSchema.index({ communityId: 1, createdAt: -1 });
postSchema.index({ moderationStatus: 1, postType: 1, createdAt: -1 });
postSchema.index({ authorRef: 1, createdAt: -1 });
postSchema.index({ moderationStatus: 1, reportCount: -1 });

module.exports = mongoose.model('Post', postSchema);
