const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
const FacultyCoordinator = require('../models/FacultyCoordinator');
const CampusMantri = require('../models/CampusMantri');
const Team = require('../models/Team');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');
const Resource = require('../models/Resource');
const Announcement = require('../models/Announcement');
const Member = require('../models/Member');

const MOCK_HOMEPAGE = {
  success: true,
  settings: {
    heroHeading: 'Empowering Innovators, Coders & Future Tech Leaders',
    heroSubheading: 'Master Data Structures, Full-Stack Web Dev, Artificial Intelligence & Competitive Programming with Jamia Hamdard’s official GFG Campus Body.',
    ctaText: 'Explore Upcoming Events',
    ctaLink: '#events',
    contactEmail: 'gfg.chapter@jamiahamdard.ac.in',
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com'
    }
  },
  stats: {
    totalMembers: 185,
    totalEvents: 28,
    activeProjects: 14,
    communityRating: '4.9/5'
  },
  faculty: [
    {
      _id: 'f1',
      designation: 'Assistant Professor & Faculty Coordinator',
      department: 'Dept. of CSE, SEST, Jamia Hamdard',
      memberRef: {
        _id: 'm_gautami',
        name: 'Gautami Tripathi',
        email: 'gautami.tripathi@jamiahamdard.ac.in',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        skills: ['HCI', 'Healthcare', 'Computer Networks', 'Big Data Analytics']
      }
    },
    {
      _id: 'f2',
      designation: 'Assistant Professor & Faculty Mentor',
      department: 'School of Engineering Sciences and Technology (SEST)',
      memberRef: {
        _id: 'm_sherin',
        name: 'Dr. Sherin Zafar',
        email: 'sherin.zafar@jamiahamdard.ac.in',
        photo: 'https://images.unsplash.com/photo-1580894732413-a923f5456b3e?auto=format&fit=crop&w=400&q=80',
        skills: ['AI ML', 'Research', 'Python', 'Machine Learning']
      }
    }
  ],
  currentMantri: {
    _id: 'm1',
    session: '2025 - 2026',
    about: 'Spearheading chapter operations, organizing flagship hackathons, and fostering student developer engagement across campus.',
    achievements: ['Increased active chapter membership by 250%', 'Hosted 12+ Workshops with 1,500+ attendees'],
    techStack: ['React', 'Node.js', 'Express', 'MongoDB'],
    memberRef: {
      name: 'Saquib Sarfaraz',
      email: 'saquib.mantri@gfgcampus.org',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    }
  },
  teams: [
    {
      _id: 't1',
      name: 'Technical Bureau',
      icon: 'Code2',
      description: 'Builds chapter web portals, open-source projects, and conducts hands-on coding bootcamps.',
      leadRef: { name: 'Aisha Khan', role: 'Technical Lead', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' },
      coLeadRef: { name: 'Rohan Sharma', role: 'Technical Co-Lead', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' }
    }
  ],
  events: [
    {
      _id: 'e1',
      banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      title: 'GeeksHack 2026: Flagship 24-Hour Hackathon',
      description: 'Join 300+ student developers for an intense 24-hour coding sprint with prize pool worth ₹1,50,000!',
      date: new Date('2026-08-20'),
      venue: 'Auditorium Hall, Jamia Hamdard Campus',
      status: 'Registration Open'
    }
  ],
  gallery: [
    {
      _id: 'g1',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      title: 'Team Collaboration at GeeksHack',
      album: 'Hackathons'
    }
  ],
  resources: [
    {
      _id: 'r1',
      title: 'Ultimate DSA & SDE Sheet (500+ Problems)',
      description: 'Curated list of Data Structures & Algorithms topic-wise practice problems.',
      fileUrl: '#',
      category: 'DSA',
      downloadsCount: 1420
    }
  ],
  announcements: [
    {
      _id: 'a1',
      title: '🚀 GeeksHack 2026 Registrations are Now Live!',
      description: 'Register your team before August 15th to claim early-bird perks and mentor access.',
      priority: 'High'
    }
  ]
};

exports.getHomepageData = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json(MOCK_HOMEPAGE);
  }

  try {
    const communityId = req.query.communityId || 'gfg-jamia-hamdard';

    let settings = await SiteSettings.findOne({ communityId });
    if (!settings) {
      settings = MOCK_HOMEPAGE.settings;
    }

    const faculty = await FacultyCoordinator.find({ communityId, status: 'Active' })
      .populate('memberRef')
      .sort({ displayOrder: 1 })
      .lean();

    const currentMantri = await CampusMantri.findOne({ communityId, isCurrent: true, status: 'Active' })
      .populate('memberRef')
      .lean();

    const teams = await Team.find({ communityId, status: 'Active' })
      .populate('leadRef')
      .populate('coLeadRef')
      .populate('memberRefs')
      .sort({ displayOrder: 1 })
      .lean();

    const events = await Event.find({
      communityId,
      status: { $in: ['Published', 'Registration Open', 'Live'] }
    })
      .sort({ date: 1 })
      .limit(6)
      .lean();

    const gallery = await Gallery.find({ communityId, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const resources = await Resource.find({ communityId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const announcements = await Announcement.find({ communityId, status: 'Active' })
      .sort({ priority: -1, createdAt: -1 })
      .limit(5)
      .lean();

    const totalMembers = await Member.countDocuments({ communityId, status: 'Active' });
    const totalEvents = await Event.countDocuments({ communityId });

    return res.json({
      success: true,
      settings,
      stats: {
        totalMembers: totalMembers || 150,
        totalEvents: totalEvents || 24,
        activeProjects: 12,
        communityRating: '4.9/5'
      },
      faculty: faculty.length ? faculty : MOCK_HOMEPAGE.faculty,
      currentMantri: currentMantri || MOCK_HOMEPAGE.currentMantri,
      teams: teams.length ? teams : MOCK_HOMEPAGE.teams,
      events: events.length ? events : MOCK_HOMEPAGE.events,
      gallery: gallery.length ? gallery : MOCK_HOMEPAGE.gallery,
      resources: resources.length ? resources : MOCK_HOMEPAGE.resources,
      announcements: announcements.length ? announcements : MOCK_HOMEPAGE.announcements
    });
  } catch (error) {
    console.warn('[Homepage Controller fallback triggered]:', error.message);
    return res.json(MOCK_HOMEPAGE);
  }
};
