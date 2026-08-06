const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  legacyId: { type: String, unique: true, sparse: true }, // Links to GFG-CMP-Content legacy gallery item
  source: { type: String, enum: ['legacy', 'cloudinary', 'admin'], default: 'cloudinary' },
  publicId: { type: String, default: '' }, // Cloudinary publicId (empty for legacy assets)
  url: { type: String, required: true },
  title: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  album: { type: String, default: 'General' },
  category: { type: String, default: '' },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  eventRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
