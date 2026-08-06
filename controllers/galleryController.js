const mongoose = require('mongoose');
const Gallery = require('../models/Gallery');

const MOCK_GALLERY = [
  {
    _id: 'g1',
    title: 'CodeMania Hackathon 2026 Opening Ceremony',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    album: 'CodeMania Hackathon 2026',
    category: 'Hackathon',
    createdAt: new Date('2026-07-20')
  },
  {
    _id: 'g2',
    title: 'AI & Machine Learning Hands-on Workshop',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    album: 'AI & ML Workshop',
    category: 'Workshops',
    createdAt: new Date('2026-07-25')
  },
  {
    _id: 'g3',
    title: 'GFG Chapter Induction & Mentorship Session',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    album: 'Campus Activities',
    category: 'Meetups',
    createdAt: new Date('2026-08-01')
  }
];

exports.getGalleryItems = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, count: MOCK_GALLERY.length, data: MOCK_GALLERY });
  }

  try {
    const { album, featured, category } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };
    if (album && album !== 'All') filter.album = album;
    if (category && category !== 'All') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const items = await Gallery.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: items.length, data: items.length > 0 ? items : MOCK_GALLERY });
  } catch (err) {
    return res.json({ success: true, count: MOCK_GALLERY.length, data: MOCK_GALLERY });
  }
};

exports.createGalleryItem = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const newDoc = { _id: `g_${Date.now()}`, ...req.body, createdAt: new Date() };
    MOCK_GALLERY.unshift(newDoc);
    return res.status(201).json({ success: true, data: newDoc });
  }

  try {
    const item = await Gallery.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.createBatchGalleryItems = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid or empty items array' });
  }

  if (mongoose.connection.readyState !== 1) {
    const createdDocs = items.map((it, i) => ({
      _id: `g_${Date.now()}_${i}`,
      ...it,
      communityId: 'gfg-jamia-hamdard',
      createdAt: new Date()
    }));
    MOCK_GALLERY.unshift(...createdDocs);
    return res.status(201).json({ success: true, count: createdDocs.length, data: createdDocs });
  }

  try {
    const docs = items.map(it => ({ ...it, communityId: 'gfg-jamia-hamdard' }));
    const inserted = await Gallery.insertMany(docs);
    return res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateGalleryItem = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_GALLERY.findIndex(g => g._id === req.params.id);
    if (idx !== -1) {
      MOCK_GALLERY[idx] = { ...MOCK_GALLERY[idx], ...req.body };
      return res.json({ success: true, data: MOCK_GALLERY[idx] });
    }
    return res.status(404).json({ success: false, message: 'Gallery item not found' });
  }

  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteGalleryItem = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_GALLERY.findIndex(g => g._id === req.params.id);
    if (idx !== -1) MOCK_GALLERY.splice(idx, 1);
    return res.json({ success: true, message: 'Gallery item deleted' });
  }

  try {
    await Gallery.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Gallery item deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
