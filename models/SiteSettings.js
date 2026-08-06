const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', unique: true, index: true },
  siteTitle: { type: String, default: 'GeeksforGeeks Student Chapter | Jamia Hamdard' },
  metaDescription: { type: String, default: 'Official GeeksforGeeks Student Chapter Community Management Platform' },
  heroHeading: { type: String, default: 'Empowering Innovators, Coders & Future Tech Leaders' },
  heroSubheading: { type: String, default: 'Join the premier student tech chapter to master Data Structures, Web Dev, AI & Competitive Programming.' },
  ctaText: { type: String, default: 'Explore Events & Join' },
  ctaLink: { type: String, default: '#events' },
  heroBgUrl: { type: String, default: '' },
  contactEmail: { type: String, default: 'gfg.chapter@jamiahamdard.ac.in' },
  socialLinks: {
    github: { type: String, default: 'https://github.com' },
    linkedin: { type: String, default: 'https://linkedin.com' },
    instagram: { type: String, default: 'https://instagram.com' },
    youtube: { type: String, default: 'https://youtube.com' }
  }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
