const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

const MOCK_ANNOUNCEMENTS = [
  {
    _id: 'a1',
    title: 'Flagship Campus Hackathon 2026 Announced',
    description: 'Registration is now open for the annual GeeksforGeeks Jamia Hamdard Hackathon! 48-hour challenge with ₹50,000+ prize pool.',
    type: 'Opportunity',
    priority: 'High',
    linkUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc_sample_hackathon/viewform',
    linkLabel: 'Apply Now',
    isPinned: true,
    status: 'Published',
    publishDate: new Date('2026-08-01')
  },
  {
    _id: 'a2',
    title: 'Weekly DSA & System Design Study Circle',
    description: 'Join us every Wednesday at 5:00 PM for live problem solving on Graph Algorithms and Microservices Architecture.',
    type: 'Event',
    priority: 'Medium',
    linkUrl: '/community',
    linkLabel: 'Join Discussion',
    isPinned: false,
    status: 'Published',
    publishDate: new Date('2026-07-28')
  },
  {
    _id: 'a3',
    title: 'Open Source Contribution Sprint for Chapter Members',
    description: 'Contribute to the official GFG Campus web platform and build your GitHub portfolio with guided mentorship.',
    type: 'Announcement',
    priority: 'Medium',
    linkUrl: 'https://github.com',
    linkLabel: 'View Repository',
    isPinned: false,
    status: 'Published',
    publishDate: new Date('2026-07-25')
  }
];

exports.getAnnouncements = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, count: MOCK_ANNOUNCEMENTS.length, data: MOCK_ANNOUNCEMENTS });
  }

  try {
    const { status } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };
    if (status && status !== 'All') filter.status = status;

    const list = await Announcement.find(filter).sort({ isPinned: -1, createdAt: -1 });
    return res.json({ success: true, count: list.length, data: list.length > 0 ? list : MOCK_ANNOUNCEMENTS });
  } catch (err) {
    return res.json({ success: true, count: MOCK_ANNOUNCEMENTS.length, data: MOCK_ANNOUNCEMENTS });
  }
};

exports.createAnnouncement = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const newDoc = { _id: `a_${Date.now()}`, ...req.body, status: req.body.status || 'Published' };
    MOCK_ANNOUNCEMENTS.unshift(newDoc);
    return res.status(201).json({ success: true, data: newDoc });
  }

  try {
    const announcement = await Announcement.create(req.body);
    return res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_ANNOUNCEMENTS.findIndex(a => a._id === req.params.id);
    if (idx !== -1) {
      MOCK_ANNOUNCEMENTS[idx] = { ...MOCK_ANNOUNCEMENTS[idx], ...req.body };
      return res.json({ success: true, data: MOCK_ANNOUNCEMENTS[idx] });
    }
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    return res.json({ success: true, data: announcement });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_ANNOUNCEMENTS.findIndex(a => a._id === req.params.id);
    if (idx !== -1) MOCK_ANNOUNCEMENTS.splice(idx, 1);
    return res.json({ success: true, message: 'Announcement deleted' });
  }

  try {
    await Announcement.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.togglePinAnnouncement = async (req, res) => {
  const { id } = req.params;
  if (mongoose.connection.readyState !== 1) {
    const item = MOCK_ANNOUNCEMENTS.find(a => a._id === id);
    if (item) {
      item.isPinned = !item.isPinned;
      return res.json({ success: true, data: item });
    }
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  try {
    const item = await Announcement.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' });
    item.isPinned = !item.isPinned;
    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
