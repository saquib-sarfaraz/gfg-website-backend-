const mongoose = require('mongoose');
const Gallery = require('../models/Gallery');
const AuditLog = require('../models/AuditLog');
const { deleteAsset } = require('../services/cloudinaryService');

// ============================================================
// LEGACY GFG-CMP GALLERY (AUTHORITATIVE APPROVED CONTENT)
// These are REAL project gallery items from GFG-CMP-Content.
// They use local /assets/gallery/ paths which are valid assets.
// They serve as canonical fallback when MongoDB has no migrated records.
// ============================================================
const LEGACY_GALLERY = [
  // Event Gallery (28 items)
  { _id: 'gal_001', legacyId: 'gal_001', url: '/assets/gallery/events-gallery-001.jpg', title: 'GFG Campus Moment 1', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_002', legacyId: 'gal_002', url: '/assets/gallery/events-gallery-002.jpg', title: 'GFG Campus Moment 2', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_003', legacyId: 'gal_003', url: '/assets/gallery/events-gallery-003.jpg', title: 'GFG Campus Moment 3', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_004', legacyId: 'gal_004', url: '/assets/gallery/events-gallery-004.jpg', title: 'GFG Campus Moment 4', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_005', legacyId: 'gal_005', url: '/assets/gallery/events-gallery-005.jpg', title: 'GFG Campus Moment 5', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_006', legacyId: 'gal_006', url: '/assets/gallery/events-gallery-006.jpg', title: 'GFG Campus Moment 6', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_007', legacyId: 'gal_007', url: '/assets/gallery/events-gallery-007.jpg', title: 'GFG Campus Moment 7', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_008', legacyId: 'gal_008', url: '/assets/gallery/events-gallery-008.jpg', title: 'GFG Campus Moment 8', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_009', legacyId: 'gal_009', url: '/assets/gallery/events-gallery-009.jpg', title: 'GFG Campus Moment 9', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_010', legacyId: 'gal_010', url: '/assets/gallery/events-gallery-010.jpg', title: 'GFG Campus Moment 10', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_011', legacyId: 'gal_011', url: '/assets/gallery/events-gallery-011.jpg', title: 'GFG Campus Moment 11', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_012', legacyId: 'gal_012', url: '/assets/gallery/events-gallery-012.jpg', title: 'GFG Campus Moment 12', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_013', legacyId: 'gal_013', url: '/assets/gallery/events-gallery-013.jpg', title: 'GFG Campus Moment 13', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_014', legacyId: 'gal_014', url: '/assets/gallery/events-gallery-014.jpg', title: 'GFG Campus Moment 14', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_015', legacyId: 'gal_015', url: '/assets/gallery/events-gallery-015.jpg', title: 'GFG Campus Moment 15', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_016', legacyId: 'gal_016', url: '/assets/gallery/events-gallery-016.jpg', title: 'GFG Campus Moment 16', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_017', legacyId: 'gal_017', url: '/assets/gallery/events-gallery-017.jpg', title: 'GFG Campus Moment 17', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_018', legacyId: 'gal_018', url: '/assets/gallery/events-gallery-018.jpg', title: 'GFG Campus Moment 18', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_019', legacyId: 'gal_019', url: '/assets/gallery/events-gallery-019.jpg', title: 'GFG Campus Moment 19', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_020', legacyId: 'gal_020', url: '/assets/gallery/events-gallery-020.jpg', title: 'GFG Campus Moment 20', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_021', legacyId: 'gal_021', url: '/assets/gallery/events-gallery-021.jpg', title: 'GFG Campus Moment 21', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_022', legacyId: 'gal_022', url: '/assets/gallery/events-gallery-022.jpg', title: 'GFG Campus Moment 22', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_023', legacyId: 'gal_023', url: '/assets/gallery/events-gallery-023.jpg', title: 'GFG Campus Moment 23', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_024', legacyId: 'gal_024', url: '/assets/gallery/events-gallery-024.jpg', title: 'GFG Campus Moment 24', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_025', legacyId: 'gal_025', url: '/assets/gallery/events-gallery-025.jpg', title: 'GFG Campus Moment 25', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_026', legacyId: 'gal_026', url: '/assets/gallery/events-gallery-026.jpg', title: 'GFG Campus Moment 26', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_027', legacyId: 'gal_027', url: '/assets/gallery/events-gallery-027.jpg', title: 'GFG Campus Moment 27', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_028', legacyId: 'gal_028', url: '/assets/gallery/events-gallery-030.jpg', title: 'GFG Campus Moment 28', album: 'Event Gallery', mediaType: 'image', source: 'legacy' },

  // Community Gallery (20 items)
  { _id: 'gal_029', legacyId: 'gal_029', url: '/assets/gallery/gallery-001.jpg', title: 'GFG Campus Moment 29', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_030', legacyId: 'gal_030', url: '/assets/gallery/gallery-003.jpg', title: 'GFG Campus Moment 30', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_031', legacyId: 'gal_031', url: '/assets/gallery/gallery-004.jpg', title: 'GFG Campus Moment 31', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_032', legacyId: 'gal_032', url: '/assets/gallery/gallery-006.jpg', title: 'GFG Campus Moment 32', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_033', legacyId: 'gal_033', url: '/assets/gallery/gallery-009.jpg', title: 'GFG Campus Moment 33', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_034', legacyId: 'gal_034', url: '/assets/gallery/gallery-010.jpg', title: 'GFG Campus Moment 34', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_035', legacyId: 'gal_035', url: '/assets/gallery/gallery-011.jpg', title: 'GFG Campus Moment 35', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_036', legacyId: 'gal_036', url: '/assets/gallery/gallery-012.jpg', title: 'GFG Campus Moment 36', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_037', legacyId: 'gal_037', url: '/assets/gallery/gallery-014.jpg', title: 'GFG Campus Moment 37', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_038', legacyId: 'gal_038', url: '/assets/gallery/gallery-015.jpg', title: 'GFG Campus Moment 38', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_039', legacyId: 'gal_039', url: '/assets/gallery/gallery-016.jpg', title: 'GFG Campus Moment 39', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_040', legacyId: 'gal_040', url: '/assets/gallery/gallery-019.jpg', title: 'GFG Campus Moment 40', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_041', legacyId: 'gal_041', url: '/assets/gallery/gallery-020.jpg', title: 'GFG Campus Moment 41', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_042', legacyId: 'gal_042', url: '/assets/gallery/gallery-021.jpg', title: 'GFG Campus Moment 42', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_043', legacyId: 'gal_043', url: '/assets/gallery/gallery-022.jpg', title: 'GFG Campus Moment 43', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_044', legacyId: 'gal_044', url: '/assets/gallery/gallery-024.jpg', title: 'GFG Campus Moment 44', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_045', legacyId: 'gal_045', url: '/assets/gallery/gallery-025.jpg', title: 'GFG Campus Moment 45', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_046', legacyId: 'gal_046', url: '/assets/gallery/gallery-026.jpg', title: 'GFG Campus Moment 46', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_047', legacyId: 'gal_047', url: '/assets/gallery/gallery-027.jpg', title: 'GFG Campus Moment 47', album: 'Community Gallery', mediaType: 'image', source: 'legacy' },
  { _id: 'gal_048', legacyId: 'gal_048', url: '/assets/gallery/gallery-028.jpg', title: 'GFG Campus Moment 48', album: 'Community Gallery', mediaType: 'image', source: 'legacy' }
];

// ============================================================
// MERGE & DEDUPLICATE: MongoDB gallery overrides legacy by legacyId/url
// ============================================================
function mergeGalleryWithLegacy(dbItems, albumFilter) {
  const dbLegacyIds = new Set(dbItems.filter(g => g.legacyId).map(g => g.legacyId));
  const dbUrls = new Set(dbItems.map(g => g.url));

  const merged = [...dbItems];

  let legacyToMerge = LEGACY_GALLERY;
  if (albumFilter && albumFilter !== 'All') {
    legacyToMerge = LEGACY_GALLERY.filter(g => g.album === albumFilter);
  }

  for (const legacy of legacyToMerge) {
    const isDuplicate = dbLegacyIds.has(legacy.legacyId) || dbUrls.has(legacy.url);
    if (!isDuplicate) {
      merged.push(legacy);
    }
  }

  return merged;
}

// GET all gallery items — merges MongoDB + legacy with dedup
exports.getGalleryItems = async (req, res) => {
  try {
    let dbItems = [];

    if (mongoose.connection.readyState === 1) {
      const { album, featured, category } = req.query;
      const filter = { communityId: 'gfg-jamia-hamdard' };
      if (album && album !== 'All') filter.album = album;
      if (category && category !== 'All') filter.category = category;
      if (featured === 'true') filter.isFeatured = true;

      dbItems = await Gallery.find(filter).sort({ createdAt: -1 }).lean();
    }

    const albumFilter = req.query.album;
    const merged = mergeGalleryWithLegacy(dbItems, albumFilter);
    return res.json({ success: true, count: merged.length, data: merged });
  } catch (err) {
    console.error('[Gallery Controller Error]:', err);
    return res.json({ success: true, count: LEGACY_GALLERY.length, data: LEGACY_GALLERY });
  }
};

// CREATE single gallery item (new uploads go to Cloudinary → MongoDB)
exports.createGalleryItem = async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      communityId: 'gfg-jamia-hamdard',
      source: req.body.source || 'cloudinary'
    };
    const item = await Gallery.create(itemData);
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// CREATE batch gallery items (multiple upload — APPENDS, never replaces)
exports.createBatchGalleryItems = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid or empty items array' });
  }

  try {
    const docs = items.map(it => ({
      ...it,
      communityId: 'gfg-jamia-hamdard',
      source: it.source || 'cloudinary'
    }));
    const inserted = await Gallery.insertMany(docs);
    return res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// UPDATE gallery item
exports.updateGalleryItem = async (req, res) => {
  try {
    const existing = await Gallery.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Gallery item not found' });

    const oldPublicId = existing.publicId;
    const updateData = { ...req.body };
    delete updateData._id;

    const item = await Gallery.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (oldPublicId && updateData.publicId && oldPublicId !== updateData.publicId) {
      deleteAsset(oldPublicId, 'image').catch(err =>
        console.warn('[GalleryUpdate] Old Cloudinary image cleanup warning:', err.message)
      );
    }

    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// DELETE gallery item (permanent delete for dynamic gallery assets)
exports.deleteGalleryItem = async (req, res) => {
  const { id } = req.params;

  // Protect legacy items
  if (id.startsWith('gal_')) {
    return res.status(403).json({ success: false, message: 'Legacy historical gallery items are protected.' });
  }

  try {
    const item = await Gallery.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found' });

    const publicId = item.publicId;

    // 1. Delete MongoDB record first (Source of Truth)
    await Gallery.findByIdAndDelete(id);

    // 2. Non-blocking Cloudinary cleanup if explicit publicId present
    if (publicId && !publicId.startsWith('local_')) {
      deleteAsset(publicId, 'image').catch(err => console.error('[GalleryDelete] Cloudinary cleanup error:', err));
    }

    // 3. Audit Log
    if (req.user) {
      AuditLog.create({
        operatorRef: req.user._id,
        operatorRole: req.user.role || 'Admin',
        action: 'GALLERY_MEDIA_DELETE',
        targetType: 'gallery',
        targetId: id,
        targetTitle: item.title || 'Untitled Photo'
      }).catch(err => console.error('[AuditLog Error]:', err));
    }

    return res.json({ success: true, deletedGalleryId: id, message: 'Gallery item permanently deleted.' });
  } catch (err) {
    console.error('[DeleteGalleryItem Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Export for migration scripts
exports.LEGACY_GALLERY = LEGACY_GALLERY;
