const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['Announcement', 'Opportunity', 'Event', 'Update', 'Important'],
    default: 'Announcement'
  },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  linkUrl: { type: String, default: '' },
  linkLabel: { type: String, default: 'Learn More' },
  isPinned: { type: Boolean, default: false },
  publishDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  status: { type: String, enum: ['Active', 'Published', 'Draft', 'Archived'], default: 'Published' }
}, { timestamps: true });

announcementSchema.index({ communityId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
