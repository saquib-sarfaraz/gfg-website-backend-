const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileUrl: { type: String, required: true },
  publicId: { type: String, default: '' },
  fileResourceType: { type: String, default: 'raw' },   // Cloudinary resource_type: 'raw' for PDFs, 'image' for others
  resourceType: { type: String, enum: ['PDF', 'Link', 'Video', 'Document'], default: 'PDF' },
  category: { type: String, enum: ['DSA', 'Development', 'Placement', 'Interview', 'Roadmaps', 'Notes', 'Other'], default: 'DSA' },
  access: { type: String, enum: ['Public', 'Members Only'], default: 'Public' },
  tags: [{ type: String }],
  status: { type: String, enum: ['Published', 'Draft', 'Archived'], default: 'Published' },
  downloadsCount: { type: Number, default: 0 }
}, { timestamps: true });

resourceSchema.index({ communityId: 1, category: 1, status: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
