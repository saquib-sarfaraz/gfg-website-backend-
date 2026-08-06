const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  communityId: {
    type: String,
    default: 'gfg-jamia-hamdard'
  },
  reporterRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  targetType: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },
  targetRef: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Post', 'Comment']
  },
  targetAuthorRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  reason: {
    type: String,
    enum: [
      'Spam',
      'Harassment',
      'Hate or abusive content',
      'Misleading information',
      'Inappropriate content',
      'Scam / suspicious link',
      'Privacy concern',
      'Other'
    ],
    required: true
  },
  details: {
    type: String,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  resolutionAction: {
    type: String,
    enum: ['keep', 'hide', 'delete', 'warn_user', 'none'],
    default: 'none'
  },
  moderatorNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for performance & unique report enforcement
reportSchema.index({ reporterRef: 1, targetType: 1, targetRef: 1 }, { unique: true });
reportSchema.index({ targetType: 1, targetRef: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterRef: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
