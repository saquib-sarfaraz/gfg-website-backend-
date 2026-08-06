const mongoose = require('mongoose');
const Resource = require('../models/Resource');

const MOCK_RESOURCES = [
  {
    _id: 'res_1',
    title: 'Complete Data Structures & Algorithms Roadmap 2026',
    description: 'Comprehensive DSA guide covering Arrays, Graphs, Dynamic Programming, and System Design with LeetCode solutions.',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    resourceType: 'PDF',
    category: 'DSA',
    access: 'Public',
    tags: ['DSA', 'Arrays', 'Graphs', 'Placement'],
    status: 'Published',
    downloadsCount: 142,
    createdAt: new Date('2026-07-15')
  },
  {
    _id: 'res_2',
    title: 'Full-Stack Web Development Starter Kit',
    description: 'Curated repository of React, Next.js, Node.js, and MongoDB starter templates and architectural best practices.',
    fileUrl: 'https://github.com/geeksforgeeks',
    resourceType: 'Link',
    category: 'Development',
    access: 'Public',
    tags: ['Web Development', 'React', 'Node.js'],
    status: 'Published',
    downloadsCount: 98,
    createdAt: new Date('2026-07-20')
  },
  {
    _id: 'res_3',
    title: 'Top Product Company Interview Question Vault',
    description: 'Exclusive compilation of real technical interview questions asked at Tier-1 product companies.',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    resourceType: 'PDF',
    category: 'Placement',
    access: 'Members Only',
    tags: ['Interview', 'Placement', 'System Design'],
    status: 'Published',
    downloadsCount: 210,
    createdAt: new Date('2026-08-01')
  }
];

exports.getResources = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, count: MOCK_RESOURCES.length, data: MOCK_RESOURCES });
  }

  try {
    const { category, access, status } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };

    if (category && category !== 'All') filter.category = category;
    if (access && access !== 'All') filter.access = access;
    if (status && status !== 'All') filter.status = status;

    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: resources.length, data: resources.length > 0 ? resources : MOCK_RESOURCES });
  } catch (err) {
    return res.json({ success: true, count: MOCK_RESOURCES.length, data: MOCK_RESOURCES });
  }
};

exports.createResource = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const newDoc = { _id: `res_${Date.now()}`, ...req.body, downloadsCount: 0, createdAt: new Date() };
    MOCK_RESOURCES.unshift(newDoc);
    return res.status(201).json({ success: true, data: newDoc });
  }

  try {
    const resource = await Resource.create(req.body);
    return res.status(201).json({ success: true, data: resource });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateResource = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_RESOURCES.findIndex(r => r._id === req.params.id);
    if (idx !== -1) {
      MOCK_RESOURCES[idx] = { ...MOCK_RESOURCES[idx], ...req.body };
      return res.json({ success: true, data: MOCK_RESOURCES[idx] });
    }
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    return res.json({ success: true, data: resource });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.incrementDownloads = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const r = MOCK_RESOURCES.find(item => item._id === req.params.id);
    if (r) r.downloadsCount = (r.downloadsCount || 0) + 1;
    return res.json({ success: true, downloadsCount: r ? r.downloadsCount : 0 });
  }

  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloadsCount: 1 } }, { new: true });
    return res.json({ success: true, downloadsCount: resource ? resource.downloadsCount : 0 });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteResource = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_RESOURCES.findIndex(r => r._id === req.params.id);
    if (idx !== -1) MOCK_RESOURCES.splice(idx, 1);
    return res.json({ success: true, message: 'Resource deleted' });
  }

  try {
    await Resource.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
