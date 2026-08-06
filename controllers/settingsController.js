const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');

const DEFAULT_SETTINGS = {
  communityId: 'gfg-jamia-hamdard',
  siteTitle: 'GeeksforGeeks Student Chapter | Jamia Hamdard',
  metaDescription: 'Official GeeksforGeeks Student Chapter Community Management Platform',
  heroHeading: 'Empowering Innovators, Coders & Future Tech Leaders',
  heroSubheading: 'Master Data Structures, Full-Stack Web Dev, Artificial Intelligence & Competitive Programming with Jamia Hamdard’s official GFG Campus Body.',
  ctaText: 'Explore Upcoming Events',
  ctaLink: '#events',
  contactEmail: 'gfg.chapter@jamiahamdard.ac.in'
};

exports.getSettings = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: DEFAULT_SETTINGS });
  }
  try {
    let settings = await SiteSettings.findOne({ communityId: 'gfg-jamia-hamdard' });
    if (!settings) {
      settings = DEFAULT_SETTINGS;
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.json({ success: true, data: DEFAULT_SETTINGS });
  }
};

exports.updateSettings = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: { ...DEFAULT_SETTINGS, ...req.body } });
  }
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { communityId: 'gfg-jamia-hamdard' },
      req.body,
      { new: true, upsert: true }
    );
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
