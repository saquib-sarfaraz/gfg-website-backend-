const MediaAsset = require('../models/MediaAsset');
const { uploadMediaAsset } = require('../config/cloudinary');

/**
 * POST /api/media/upload
 *
 * Accepts a multipart/form-data file (field: 'mediaFile' OR 'file') and
 * uploads it to Cloudinary (production) or local storage (development fallback).
 *
 * Normalized success response:
 * {
 *   success: true,
 *   media: {
 *     url, publicId, resourceType, format, width, height, bytes
 *   },
 *   data: { url, publicId, ... }    ← backward-compat alias
 * }
 *
 * Error response:
 * {
 *   success: false,
 *   message: '...'
 * }
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file attached' });
    }

    const folder = req.body.folder || 'General';

    let uploadResult;
    try {
      uploadResult = await uploadMediaAsset(req.file.path, folder);
    } catch (uploadErr) {
      // Cloudinary failed in production — do not persist anything
      return res.status(502).json({
        success: false,
        message: uploadErr.message || 'Media upload failed. Please try again.'
      });
    }

    // Persist asset record to MediaAsset collection for Media Library
    const asset = await MediaAsset.create({
      communityId: 'gfg-jamia-hamdard',
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      folder,
      filename: req.file.originalname,
      size: uploadResult.bytes || req.file.size,
      mimeType: req.file.mimetype
    });

    // Normalized payload — expose both `media` (canonical) and `data` (backward compat)
    const mediaPayload = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      resourceType: uploadResult.resourceType || 'image',
      format: uploadResult.format || '',
      width: uploadResult.width || null,
      height: uploadResult.height || null,
      bytes: uploadResult.bytes || 0
    };

    return res.status(201).json({
      success: true,
      media: mediaPayload,
      data: { ...asset.toObject(), ...mediaPayload }
    });
  } catch (err) {
    console.error('[MediaController] uploadMedia error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMediaAssets = async (req, res) => {
  try {
    const { folder, search } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };

    if (folder && folder !== 'All') filter.folder = folder;
    if (search) filter.filename = { $regex: search, $options: 'i' };

    const assets = await MediaAsset.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: assets.length, data: assets });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteMediaAsset = async (req, res) => {
  try {
    await MediaAsset.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Media asset deleted from library' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const { isCloudinaryConfigured } = require('../config/cloudinary');

exports.getMediaHealth = async (req, res) => {
  const configured = isCloudinaryConfigured();
  return res.json({
    success: true,
    configured,
    provider: 'cloudinary',
    status: configured ? 'connected' : 'local_fallback',
    environment: process.env.NODE_ENV || 'development'
  });
};
