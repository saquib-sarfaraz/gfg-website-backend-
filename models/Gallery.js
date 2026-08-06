const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  url: { type: String, required: true },
  title: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  album: { type: String, default: 'General' },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  eventRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
