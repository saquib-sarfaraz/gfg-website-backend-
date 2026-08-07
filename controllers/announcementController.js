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

// Helper: Finds announcement by ObjectId or mock ID, creating a MongoDB document if updating mock data
const findAnnouncementByIdOrMock = async (id) => {
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Announcement.findById(id);
    if (doc) return doc;
  }

  const mock = MOCK_ANNOUNCEMENTS.find(a => a._id === id);
  if (mock && mongoose.connection.readyState === 1) {
    try {
      const created = await Announcement.create({
        title: mock.title,
        description: mock.description,
        type: mock.type || 'Announcement',
        priority: mock.priority || 'Medium',
        linkUrl: mock.linkUrl || '',
        linkLabel: mock.linkLabel || 'Learn More',
        isPinned: mock.isPinned || false,
        status: mock.status || 'Published',
        communityId: 'gfg-jamia-hamdard'
      });
      return created;
    } catch (e) {
      return mock;
    }
  }
  return mock || null;
};

exports.getAnnouncements = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, count: MOCK_ANNOUNCEMENTS.length, data: MOCK_ANNOUNCEMENTS });
  }

  try {
    const { status, scope } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };

    if (scope !== 'admin') {
      if (status && status !== 'All') {
        filter.status = status;
      } else {
        filter.status = { $in: ['Published', 'Active'] };
      }

      // Hide expired announcements for public non-admin requests
      filter.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ];
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    const list = await Announcement.find(filter).sort({ isPinned: -1, createdAt: -1 });
    const totalCount = await Announcement.countDocuments({ communityId: 'gfg-jamia-hamdard' });

    // Only fallback to mock array if MongoDB has 0 records and request is non-admin
    const dataToReturn = (totalCount === 0 && scope !== 'admin') ? MOCK_ANNOUNCEMENTS : list;

    return res.json({ success: true, count: dataToReturn.length, data: dataToReturn });
  } catch (err) {
    console.error('[getAnnouncements Error]:', err);
    return res.json({ success: true, count: 0, data: [] });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      communityId: 'gfg-jamia-hamdard',
      status: req.body.status || 'Published'
    };

    // Strip empty or non-ObjectId _id sent from frontend forms
    if (!payload._id || !mongoose.Types.ObjectId.isValid(payload._id)) {
      delete payload._id;
    }

    if (mongoose.connection.readyState !== 1) {
      const newDoc = { _id: `a_${Date.now()}`, ...payload };
      MOCK_ANNOUNCEMENTS.unshift(newDoc);
      return res.status(201).json({ success: true, data: newDoc });
    }

    const announcement = await Announcement.create(payload);
    return res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    console.error('[CreateAnnouncement Error]:', err);
    return res.status(400).json({ success: false, error: err.message, message: err.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    const payload = { ...req.body };
    delete payload._id;

    let announcement = await findAnnouncementByIdOrMock(id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

    if (typeof announcement.save === 'function') {
      Object.assign(announcement, payload);
      await announcement.save();
      return res.json({ success: true, data: announcement });
    } else {
      const idx = MOCK_ANNOUNCEMENTS.findIndex(a => a._id === id);
      if (idx !== -1) MOCK_ANNOUNCEMENTS[idx] = { ...MOCK_ANNOUNCEMENTS[idx], ...payload };
      return res.json({ success: true, data: { ...announcement, ...payload } });
    }
  } catch (err) {
    console.error('[UpdateAnnouncement Error]:', err);
    return res.status(400).json({ success: false, error: err.message, message: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Announcement.findByIdAndDelete(id);
    }
    const idx = MOCK_ANNOUNCEMENTS.findIndex(a => a._id === id);
    if (idx !== -1) MOCK_ANNOUNCEMENTS.splice(idx, 1);

    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.togglePinAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    let item = await findAnnouncementByIdOrMock(id);
    if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' });

    if (typeof item.save === 'function') {
      item.isPinned = !item.isPinned;
      await item.save();
      return res.json({ success: true, data: item });
    } else {
      item.isPinned = !item.isPinned;
      return res.json({ success: true, data: item });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
