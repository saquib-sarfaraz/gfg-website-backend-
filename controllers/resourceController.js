const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const { deleteMediaAssetFromCloudinary } = require('../config/cloudinary');

/**
 * GET /api/resources
 * Fetches 100% real dynamic resources from MongoDB Atlas database
 */
exports.getResources = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, count: 0, data: [] });
  }

  try {
    const { category, access, status } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };

    if (category && category !== 'All') filter.category = category;
    if (access && access !== 'All') filter.access = access;
    if (status && status !== 'All') filter.status = status;

    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    console.error('[getResources Error]:', err);
    return res.json({ success: true, count: 0, data: [] });
  }
};

/**
 * POST /api/resources
 * Creates a new learning resource in MongoDB Atlas
 */
exports.createResource = async (req, res) => {
  const resourceData = { ...req.body };
  if (!resourceData._id) {
    delete resourceData._id;
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database connection offline.' });
  }

  try {
    const resource = await Resource.create(resourceData);
    return res.status(201).json({ success: true, data: resource });
  } catch (err) {
    console.error('[createResource Error]:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/resources/:id
 * Updates an existing learning resource in MongoDB Atlas
 */
exports.updateResource = async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid Resource ObjectId' });
  }

  try {
    const existingResource = await Resource.findById(id);
    if (!existingResource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const oldPublicId = existingResource.publicId;
    const oldFileResourceType = existingResource.fileResourceType || 'raw';
    const updatedResource = await Resource.findByIdAndUpdate(id, updateData, { new: true });

    // Clean up old Cloudinary asset if publicId changed upon replacement
    if (oldPublicId && updateData.publicId && oldPublicId !== updateData.publicId) {
      deleteMediaAssetFromCloudinary(oldPublicId, oldFileResourceType).catch(err =>
        console.warn('[ResourceUpdate] Old Cloudinary PDF cleanup warning:', err.message)
      );
    }

    return res.json({ success: true, data: updatedResource });
  } catch (err) {
    console.error('[updateResource Error]:', err);
    return res.status(400).json({ success: false, error: err.message, message: err.message });
  }
};

/**
 * PATCH /api/resources/:id/download
 * Increments download counter for a resource in MongoDB Atlas
 */
exports.incrementDownloads = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid Resource ObjectId' });
  }

  try {
    const resource = await Resource.findByIdAndUpdate(id, { $inc: { downloadsCount: 1 } }, { new: true });
    return res.json({ success: true, downloadsCount: resource ? resource.downloadsCount : 0 });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/resources/:id
 * Permanently deletes resource document from MongoDB Atlas & removes Cloudinary PDF asset
 */
exports.deleteResource = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid Resource ObjectId' });
  }

  try {
    const resource = await Resource.findById(id);
    if (resource) {
      if (resource.publicId) {
        // Use stored fileResourceType so PDFs (raw) are deleted correctly
        const cloudinaryResourceType = resource.fileResourceType || 'raw';
        await deleteMediaAssetFromCloudinary(resource.publicId, cloudinaryResourceType).catch(err =>
          console.warn('[ResourceDelete] Cloudinary cleanup warning:', err.message)
        );
      }
      await Resource.findByIdAndDelete(id);
    }
    return res.json({ success: true, message: 'Resource permanently deleted' });
  } catch (err) {
    console.error('[deleteResource Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
