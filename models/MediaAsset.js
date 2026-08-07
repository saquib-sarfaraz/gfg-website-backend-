const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  folder: {
    type: String,
    enum: ['Faculty', 'Campus Mantri', 'Members', 'Teams', 'Events', 'Gallery', 'Resources', 'Sponsors', 'Logos', 'General', 'Posts'],
    default: 'General'
  },
  filename: { type: String, required: true },
  size: { type: Number, default: 0 },
  mimeType: { type: String, default: 'image/jpeg' }
}, { timestamps: true });

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
