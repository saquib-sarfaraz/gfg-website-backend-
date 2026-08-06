const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Member = require('../models/Member');
const FacultyCoordinator = require('../models/FacultyCoordinator');
const CampusMantri = require('../models/CampusMantri');
const Team = require('../models/Team');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');
const Resource = require('../models/Resource');
const Announcement = require('../models/Announcement');
const Form = require('../models/Form');
const SiteSettings = require('../models/SiteSettings');

const seedData = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(connStr);
    console.log('[Seeder] Connected!');

    // Clear existing
    await User.deleteMany({});
    await Member.deleteMany({});
    await FacultyCoordinator.deleteMany({});
    await CampusMantri.deleteMany({});
    await Team.deleteMany({});
    await Event.deleteMany({});
    await Gallery.deleteMany({});
    await Resource.deleteMany({});
    await Announcement.deleteMany({});
    await Form.deleteMany({});
    await SiteSettings.deleteMany({});

    // 1. Super Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'Super Admin',
      email: 'admin@gfgcampus.org',
      password: hashedPassword,
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    });
    console.log('✓ Admin user seeded');

    // 2. Site Settings
    await SiteSettings.create({
      communityId: 'gfg-jamia-hamdard',
      siteTitle: 'GeeksforGeeks Student Chapter | Jamia Hamdard',
      metaDescription: 'Official GeeksforGeeks Student Chapter Community Management Platform',
      heroHeading: 'Empowering Innovators, Coders & Future Tech Leaders',
      heroSubheading: 'Master Data Structures, Full-Stack Web Dev, Artificial Intelligence & Competitive Programming with Jamia Hamdard’s official GFG Campus Body.',
      ctaText: 'Explore Upcoming Events',
      ctaLink: '#events',
      contactEmail: 'gfg.chapter@jamiahamdard.ac.in'
    });
    console.log('✓ Site settings seeded');

    // 3. Members (Single Source of Truth)
    const members = await Member.insertMany([
      {
        name: 'Gautami Tripathi',
        email: 'gautami.tripathi@jamiahamdard.ac.in',
        role: 'Faculty Coordinator',
        teamName: 'Faculty Advisory',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        skills: ['HCI', 'Healthcare', 'Computer Networks', 'Big Data Analytics', 'Operating Systems'],
        linkedin: 'https://linkedin.com'
      },
      {
        name: 'Dr. Sherin Zafar',
        email: 'sherin.zafar@jamiahamdard.ac.in',
        role: 'Faculty Coordinator',
        teamName: 'Faculty Advisory',
        photo: 'https://images.unsplash.com/photo-1580894732413-a923f5456b3e?auto=format&fit=crop&w=400&q=80',
        skills: ['AI ML', 'Research', 'Python', 'Machine Learning'],
        linkedin: 'https://linkedin.com'
      },
      {
        name: 'Saquib Sarfaraz',
        email: 'saquib.mantri@gfgcampus.org',
        role: 'Campus Mantri',
        teamName: 'Executive Bureau',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        skills: ['React', 'Node.js', 'System Architecture', 'Community Building']
      },
      {
        name: 'Aisha Khan',
        email: 'aisha.tech@gfgcampus.org',
        role: 'Technical Lead',
        teamName: 'Technical Team',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        skills: ['Python', 'Django', 'MongoDB', 'Docker']
      },
      {
        name: 'Rohan Sharma',
        email: 'rohan.colead@gfgcampus.org',
        role: 'Technical Co-Lead',
        teamName: 'Technical Team',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        skills: ['C++', 'DSA', 'Competitive Programming', 'Go']
      },
      {
        name: 'Zoya Verma',
        email: 'zoya.design@gfgcampus.org',
        role: 'Design & PR Lead',
        teamName: 'Design & Media',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        skills: ['Figma', 'UI/UX', 'Motion Design', 'Canva']
      },
      {
        name: 'Aditya Gupta',
        email: 'aditya.events@gfgcampus.org',
        role: 'Events Lead',
        teamName: 'Event Management',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        skills: ['Event Logistics', 'Public Speaking', 'Sponsorship']
      }
    ]);
    console.log('✓ Members seeded');

    // 4. Faculty Coordinators (Gautami Tripathi & Dr. Sherin Zafar)
    await FacultyCoordinator.create([
      {
        memberRef: members[0]._id, // Gautami Tripathi
        designation: 'Assistant Professor & Faculty Coordinator',
        department: 'Dept. of CSE, SEST, Jamia Hamdard',
        displayOrder: 1,
        status: 'Active'
      },
      {
        memberRef: members[1]._id, // Dr. Sherin Zafar
        designation: 'Assistant Professor & Faculty Mentor',
        department: 'School of Engineering Sciences and Technology (SEST)',
        displayOrder: 2,
        status: 'Active'
      }
    ]);
    console.log('✓ Faculty Coordinators seeded');

    // 5. Campus Mantri
    await CampusMantri.create([
      {
        memberRef: members[2]._id, // Saquib Sarfaraz
        session: '2025 - 2026',
        startDate: new Date('2025-08-01'),
        about: 'Spearheading chapter operations, organizing flagship hackathons, and fostering student developer engagement across campus.',
        achievements: ['Increased active chapter membership by 250%', 'Hosted 12+ Workshops with 1,500+ attendees', 'Secured GFG National Top 10 Chapter Recognition'],
        techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Cloudinary'],
        isCurrent: true,
        status: 'Active'
      }
    ]);
    console.log('✓ Campus Mantri seeded');

    // 6. Teams
    await Team.create([
      {
        name: 'Technical Bureau',
        icon: 'Code2',
        description: 'Builds chapter web portals, open-source projects, and conducts hands-on coding bootcamps.',
        leadRef: members[3]._id, // Aisha Khan
        coLeadRef: members[4]._id, // Rohan Sharma
        memberRefs: [members[3]._id, members[4]._id],
        displayOrder: 1,
        status: 'Active'
      },
      {
        name: 'Design & Media',
        icon: 'Palette',
        description: 'Crafts visual identities, UI mockups, promotional media, and manages social presence.',
        leadRef: members[5]._id, // Zoya Verma
        memberRefs: [members[5]._id],
        displayOrder: 2,
        status: 'Active'
      },
      {
        name: 'Events & Operations',
        icon: 'Calendar',
        description: 'Manages physical & virtual event logistics, speaker liaison, and hackathon execution.',
        leadRef: members[6]._id, // Aditya Gupta
        memberRefs: [members[6]._id],
        displayOrder: 3,
        status: 'Active'
      }
    ]);
    console.log('✓ Teams seeded');

    // 7. Dynamic Form
    const form = await Form.create({
      title: 'GeeksHack 2026 Registration Form',
      description: 'Fill out this form to reserve your team spot for the flagship 24-hour hackathon!',
      isPublished: true,
      fields: [
        { id: 'f1', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', required: true },
        { id: 'f2', label: 'College Email ID', type: 'email', placeholder: 'student@jamiahamdard.ac.in', required: true },
        { id: 'f3', label: 'WhatsApp Phone Number', type: 'phone', placeholder: '+91 9876543210', required: true },
        { id: 'f4', label: 'Year of Study', type: 'select', options: ['1st Year', '2nd Year', '3rd Year', '4th Year'], required: true },
        { id: 'f5', label: 'Preferred Track', type: 'select', options: ['Web3 & Blockchain', 'AI & Machine Learning', 'Open Innovation', 'Healthcare Tech'], required: true },
        { id: 'f6', label: 'GitHub Profile Link', type: 'text', placeholder: 'https://github.com/username', required: false }
      ]
    });
    console.log('✓ Dynamic Form seeded');

    // 8. Events
    await Event.create([
      {
        banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        title: 'GeeksHack 2026: Flagship 24-Hour Hackathon',
        description: 'Join 300+ student developers for an intense 24-hour coding sprint with prize pool worth ₹1,50,000!',
        date: new Date('2026-08-20T10:00:00.000Z'),
        venue: 'Auditorium Hall, Jamia Hamdard Campus',
        registrationLink: '#',
        formId: form._id,
        speakers: [
          { name: 'Sandeep Jain', role: 'Founder & CEO, GeeksforGeeks', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }
        ],
        status: 'Registration Open'
      },
      {
        banner: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        title: 'DSA & System Design Masterclass',
        description: 'Deep dive into Graph algorithms, Dynamic Programming strategies, and Low-Level Design for top product tech interviews.',
        date: new Date('2026-08-05T14:00:00.000Z'),
        venue: 'Computer Lab 3, CSE Dept.',
        registrationLink: '#',
        speakers: [
          { name: 'Rohan Sharma', role: 'Technical Co-Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' }
        ],
        status: 'Published'
      }
    ]);
    console.log('✓ Events seeded');

    // 9. Gallery
    await Gallery.create([
      {
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        title: 'Team Collaboration at GeeksHack',
        mediaType: 'image',
        album: 'Hackathons',
        tags: ['Hackathon', 'Coding', 'Teamwork'],
        isFeatured: true
      },
      {
        url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
        title: 'Guest Lecture by Tech Industry Mentors',
        mediaType: 'image',
        album: 'Workshops',
        tags: ['Keynote', 'Seminar'],
        isFeatured: true
      }
    ]);
    console.log('✓ Gallery seeded');

    // 10. Resources
    await Resource.create([
      {
        title: 'Ultimate DSA & SDE Sheet (500+ Problems)',
        description: 'Curated list of Data Structures & Algorithms topic-wise practice problems with solution templates.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        category: 'DSA',
        downloadsCount: 1420
      },
      {
        title: 'Full-Stack MERN Architecture Roadmap',
        description: 'Complete visual roadmap for building scalable web apps with React, Node, Express & MongoDB.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        category: 'Development',
        downloadsCount: 890
      }
    ]);
    console.log('✓ Resources seeded');

    // 11. Announcements
    await Announcement.create([
      {
        title: '🚀 GeeksHack 2026 Registrations are Now Live!',
        description: 'Register your team before August 15th to claim early-bird perks and mentor access.',
        priority: 'High',
        status: 'Active'
      }
    ]);
    console.log('✓ Announcements seeded');

    console.log('\n[Seeder] SUCCESS! All data seeded smoothly.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedData();
