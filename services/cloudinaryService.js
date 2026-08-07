const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Destroys a single Cloudinary asset by publicId safely.
 * Non-blocking: logs failures, never throws exceptions that abort DB operations.
 *
 * @param {string} publicId     Cloudinary public_id (e.g. 'gfg-cmp/Posts/abc123')
 * @param {string} resourceType Cloudinary resource_type ('image', 'raw', 'video')
 * @returns {Promise<{ success: boolean, result?: string, error?: string }>}
 */
const deleteAsset = async (publicId, resourceType = 'image') => {
  if (!publicId || typeof publicId !== 'string' || publicId.startsWith('local_')) {
    console.log(`[CloudinaryService] Skipping deletion for non-Cloudinary asset: ${publicId}`);
    return { success: false, reason: 'invalid_or_local_public_id' };
  }

  if (!isCloudinaryConfigured()) {
    console.warn(`[CloudinaryService] Cloudinary credentials not configured. Skipping destroy for: ${publicId}`);
    return { success: false, reason: 'not_configured' };
  }

  try {
    console.log(`[CloudinaryService] Attempting destroy for publicId: ${publicId} (resource_type: ${resourceType})`);
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`[CloudinaryService] Destroy response for ${publicId}:`, result);
    return { success: result.result === 'ok', result: result.result };
  } catch (err) {
    console.error(`[CloudinaryService] Destroy failed for ${publicId}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Destroys multiple Cloudinary assets by list of { publicId, resourceType }.
 *
 * @param {Array<{ publicId: string, resourceType?: string }>} assets
 * @returns {Promise<Array<{ publicId: string, success: boolean }>>}
 */
const deleteAssets = async (assets = []) => {
  if (!Array.isArray(assets) || assets.length === 0) return [];

  const results = [];
  for (const asset of assets) {
    if (!asset || !asset.publicId) continue;
    const res = await deleteAsset(asset.publicId, asset.resourceType || 'image');
    results.push({ publicId: asset.publicId, ...res });
  }
  return results;
};

module.exports = {
  deleteAsset,
  deleteAssets
};
