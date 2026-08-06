const MediaAsset = require('../models/MediaAsset');
const { uploadMediaAsset } = require('../config/cloudinary');

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file attached' });
    }

    const folder = req.body.folder || 'General';
    const uploadResult = await uploadMediaAsset(req.file.path, folder);

    const asset = await MediaAsset.create({
      communityId: 'gfg-jamia-hamdard',
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      folder,
      filename: req.file.originalname,
      size: uploadResult.bytes || req.file.size,
      mimeType: req.file.mimetype
    });

    return res.status(201).json({ success: true, data: asset });
  } catch (err) {
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
