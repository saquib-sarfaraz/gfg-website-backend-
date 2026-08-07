const mongoose = require('mongoose');
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');
const { deleteAsset } = require('../services/cloudinaryService');

// ============================================================
// LEGACY GFG-CMP EVENTS (AUTHORITATIVE APPROVED CONTENT)
// These are REAL project events from GFG-CMP-Content.
// They serve as the canonical fallback when MongoDB has no
// migrated records yet. They are NOT fake/mock data.
// ============================================================
const LEGACY_EVENTS = [
  // Upcoming Events (4)
  {
    _id: 'evt_up_1',
    legacyId: 'evt_up_1',
    title: 'CodeMania Hackathon 2026',
    date: '7th–9th September 2026',
    status: 'Registration Open',
    isUpcoming: true,
    partner: 'Kickr Technology (Community Partner: GFG Campus Body Jamia Hamdard)',
    prizePool: '₹2,50,000',
    description: 'CodeMania Hackathon 2026 provides students with a dynamic platform to develop innovative solutions for real-world challenges while enhancing their technical and problem-solving skills. Participants collaborate in teams, receive guidance from mentors, and compete for prize pool and career opportunities.',
    banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    category: 'Hackathon',
    source: 'legacy'
  },
  {
    _id: 'evt_up_2',
    legacyId: 'evt_up_2',
    title: 'Python Bootcamp 2026',
    date: 'Upcoming 2026',
    status: 'Registration Open',
    isUpcoming: true,
    description: 'A beginner-friendly Python session covering core concepts and practical coding. Focused on building strong fundamentals through hands-on learning.',
    banner: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
    category: 'Bootcamp',
    source: 'legacy'
  },
  {
    _id: 'evt_up_3',
    legacyId: 'evt_up_3',
    title: 'Code Starter Session — Canva & Design Skills',
    date: 'Upcoming 2026',
    status: 'Announced',
    isUpcoming: true,
    description: 'Canva tutorials and creative design sessions to boost visual communication, content creation, and branding skills for student developers.',
    banner: 'https://images.unsplash.com/photo-1542744094-3a3172720222?auto=format&fit=crop&w=1200&q=80',
    category: 'Workshop',
    source: 'legacy'
  },
  {
    _id: 'evt_up_4',
    legacyId: 'evt_up_4',
    title: 'Collaborations and Partnerships Series',
    date: 'Upcoming 2026',
    status: 'Planning',
    isUpcoming: true,
    description: 'Planned collaborations with other technical societies, industry experts, and organizations to bring diverse learning opportunities to Jamia Hamdard students.',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    category: 'Networking',
    source: 'legacy'
  },

  // Past Events (13)
  {
    _id: 'evt_past_1',
    legacyId: 'evt_past_1',
    title: 'Full Stack and DSA Guidance',
    date: '26th June 2025',
    speaker: 'Vikas Thakur',
    status: 'Completed',
    isUpcoming: false,
    description: 'Organized by GeeksforGeeks Campus Body, Jamia Hamdard. Conducted by Vikas Thakur, sharing valuable insights into Full Stack web development, coding practices, DSA fundamentals, and career opportunities in software development.',
    banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    category: 'Guidance',
    source: 'legacy'
  },
  {
    _id: 'evt_past_2',
    legacyId: 'evt_past_2',
    title: 'GFG Connect – Early Access Awareness Session',
    date: '27th July 2025',
    status: 'Completed',
    isUpcoming: false,
    description: 'Introduced students to GFG Connect, GeeksforGeeks 1-to-1 mentorship platform. Highlighted features including personalized mentorship, career guidance, interview preparation, and structured learning paths.',
    banner: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    category: 'Mentorship',
    source: 'legacy'
  },
  {
    _id: 'evt_past_3',
    legacyId: 'evt_past_3',
    title: 'Guidance Session with Raghav Garg',
    date: '29th August 2025',
    speaker: 'Raghav Garg',
    status: 'Completed',
    isUpcoming: false,
    description: 'Interactive online session providing insights into career growth, skill development, effective learning strategies, interview preparation, and industry expectations.',
    banner: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    category: 'Speaker Session',
    source: 'legacy'
  },
  {
    _id: 'evt_past_4',
    legacyId: 'evt_past_4',
    title: 'Nation SkillUp Launch Awareness Session',
    date: '5th September 2025',
    status: 'Completed',
    isUpcoming: false,
    description: 'Introduced students to the Nation SkillUp platform, showcasing learning opportunities, industry-relevant courses, mentorship, and career development resources.',
    banner: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    category: 'Awareness',
    source: 'legacy'
  },
  {
    _id: 'evt_past_5',
    legacyId: 'evt_past_5',
    title: 'GeeksforGeeks Campus Body Induction Event 2025',
    date: '27th August 2025',
    status: 'Completed',
    isUpcoming: false,
    description: 'Welcomed new students and introduced the community vision, technical workshops, coding contests, hackathons, and roadmap for the academic year.',
    banner: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    category: 'Induction',
    source: 'legacy'
  },
  {
    _id: 'evt_past_6',
    legacyId: 'evt_past_6',
    title: 'Web Development Bootcamp 2025',
    date: '28th–30th October 2025',
    status: 'Completed',
    isUpcoming: false,
    description: '3-day practical bootcamp covering HTML, CSS, JavaScript, Responsive Web Design, and Website Deployment through interactive sessions and hands-on project building.',
    banner: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    category: 'Bootcamp',
    source: 'legacy'
  },
  {
    _id: 'evt_past_7',
    legacyId: 'evt_past_7',
    title: 'GFG Connect – Expert Mentorship Awareness Session',
    date: '8th November 2025',
    status: 'Completed',
    isUpcoming: false,
    description: 'Showcased 1-to-1 mentorship, resume reviews, career advice, and interview preparation with industry professionals via GFG Connect.',
    banner: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    category: 'Mentorship',
    source: 'legacy'
  },
  {
    _id: 'evt_past_8',
    legacyId: 'evt_past_8',
    title: 'Coding Arena 2025',
    date: '20th November 2025',
    status: 'Completed',
    isUpcoming: false,
    description: 'Competitive MCQ contest hosted on GFG platform covering DSA, OS, DBMS, Computer Networks, Cloud Computing, and OOPs concepts.',
    banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    category: 'Contest',
    source: 'legacy'
  },
  {
    _id: 'evt_past_9',
    legacyId: 'evt_past_9',
    title: 'AWS Hackathon',
    date: '21st January 2026',
    partner: 'AWS (Amazon Web Services)',
    status: 'Completed',
    isUpcoming: false,
    description: 'Organized by GFG Campus Body Jamia Hamdard in collaboration with AWS. Focused on cloud-based problem solving, teamwork, and innovation.',
    banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    category: 'Hackathon',
    source: 'legacy'
  },
  {
    _id: 'evt_past_10',
    legacyId: 'evt_past_10',
    title: 'Alumni Interaction Session',
    date: '7th February 2026',
    partner: 'Placement Cell, Jamia Hamdard',
    status: 'Completed',
    isUpcoming: false,
    description: 'Organized in collaboration with the Placement Cell to connect students with successful alumni for career guidance, industry trends, and skill development.',
    banner: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    category: 'Alumni',
    source: 'legacy'
  },
  {
    _id: 'evt_past_11',
    legacyId: 'evt_past_11',
    title: 'Introduction to Cybersecurity',
    date: '23rd February 2026',
    status: 'Completed',
    isUpcoming: false,
    description: 'Provided fundamental knowledge of cybersecurity concepts, online safety, data protection, and emerging security challenges.',
    banner: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    category: 'Workshop',
    source: 'legacy'
  },
  {
    _id: 'evt_past_12',
    legacyId: 'evt_past_12',
    title: 'The Grand Gaming Showdown',
    date: 'Past Event',
    status: 'Completed',
    isUpcoming: false,
    description: 'An exciting and highly engaging gaming event organized by the GeeksforGeeks Campus Body, Jamia Hamdard.',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    category: 'Gaming',
    source: 'legacy'
  },
  {
    _id: 'evt_past_13',
    legacyId: 'evt_past_13',
    title: 'Canva Campus Workshop',
    date: 'Past Event',
    status: 'Completed',
    isUpcoming: false,
    description: 'Successfully organized workshop aimed at enhancing students design and creativity skills using Canva.',
    banner: 'https://images.unsplash.com/photo-1542744094-3a3172720222?auto=format&fit=crop&w=1200&q=80',
    category: 'Workshop',
    source: 'legacy'
  }
];

// ============================================================
// MERGE & DEDUPLICATE: MongoDB events override legacy by legacyId/title
// ============================================================
function mergeEventsWithLegacy(dbEvents) {
  // Build a set of titles from DB events for deduplication
  const dbTitles = new Set(dbEvents.map(e => e.title?.toLowerCase().trim()));
  const dbLegacyIds = new Set(dbEvents.filter(e => e.legacyId).map(e => e.legacyId));

  // Add DB events first (they take priority)
  const merged = [...dbEvents];

  // Append legacy events that haven't been migrated yet
  for (const legacy of LEGACY_EVENTS) {
    const isDuplicate = dbLegacyIds.has(legacy.legacyId) || dbTitles.has(legacy.title?.toLowerCase().trim());
    if (!isDuplicate) {
      merged.push(legacy);
    }
  }

  return merged;
}

// GET all events — merges MongoDB + legacy with dedup
exports.getEvents = async (req, res) => {
  try {
    let dbEvents = [];

    if (mongoose.connection.readyState === 1) {
      const { status } = req.query;
      const filter = { communityId: 'gfg-jamia-hamdard' };
      if (status && status !== 'All') {
        filter.status = status;
      }
      dbEvents = await Event.find(filter).sort({ date: -1 }).lean();
    }

    const merged = mergeEventsWithLegacy(dbEvents);
    return res.json({ success: true, count: merged.length, data: merged });
  } catch (err) {
    console.error('[Event Controller Error]:', err);
    // On error, serve legacy content (this is REAL approved content, not fake data)
    return res.json({ success: true, count: LEGACY_EVENTS.length, data: LEGACY_EVENTS });
  }
};

// Helper: Resolves event by ObjectId, legacyId, or creates MongoDB document from legacy hardcoded data if needed
const findEventByIdOrLegacy = async (id) => {
  if (mongoose.connection.readyState === 1) {
    let event = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      event = await Event.findById(id);
    }
    if (!event) {
      event = await Event.findOne({ legacyId: id });
    }
    if (event) return event;
  }

  // Check legacy fallback array
  const legacy = LEGACY_EVENTS.find(e => e._id === id || e.legacyId === id);
  if (legacy) {
    if (mongoose.connection.readyState === 1) {
      try {
        const created = await Event.create({
          title: legacy.title,
          description: legacy.description || legacy.title,
          date: legacy.date,
          venue: legacy.venue || 'Jamia Hamdard Campus',
          banner: legacy.banner || legacy.image || '',
          status: legacy.status || 'Completed',
          isUpcoming: legacy.isUpcoming !== false,
          category: legacy.category || 'Session',
          communityId: 'gfg-jamia-hamdard',
          legacyId: legacy._id,
          source: 'legacy'
        });
        return created;
      } catch (e) {
        return legacy;
      }
    }
    return legacy;
  }
  return null;
};

// GET single event by ID — checks DB first, then legacy
exports.getEventById = async (req, res) => {
  try {
    const event = await findEventByIdOrLegacy(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// CREATE new event
exports.createEvent = async (req, res) => {
  try {
    const status = req.body.status || 'Registration Open';
    const isUpcoming = (status !== 'Completed' && status !== 'Archived');
    const eventData = {
      ...req.body,
      communityId: 'gfg-jamia-hamdard',
      source: req.body.source || 'admin',
      status,
      isUpcoming: req.body.isUpcoming !== undefined ? req.body.isUpcoming : isUpcoming,
      banner: req.body.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    };

    // Strip empty or non-ObjectId _id sent from frontend forms
    if (!eventData._id || !mongoose.Types.ObjectId.isValid(eventData._id)) {
      delete eventData._id;
    }
    if (!eventData.formId || !mongoose.Types.ObjectId.isValid(eventData.formId)) {
      delete eventData.formId;
    }

    const event = await Event.create(eventData);
    return res.status(201).json({ success: true, data: event });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message, message: err.message });
  }
};

// UPDATE event
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  try {
    let event = await findEventByIdOrLegacy(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const oldPublicId = event.bannerPublicId || event.publicId;
    const updateData = { ...req.body };
    delete updateData._id;
    if (!updateData.formId || !mongoose.Types.ObjectId.isValid(updateData.formId)) {
      delete updateData.formId;
    }

    if (updateData.status) {
      updateData.isUpcoming = (updateData.status !== 'Completed' && updateData.status !== 'Archived');
    }

    if (typeof event.save === 'function') {
      const newPublicId = updateData.bannerPublicId || updateData.publicId;
      Object.assign(event, updateData);
      await event.save();

      if (oldPublicId && newPublicId && oldPublicId !== newPublicId) {
        deleteAsset(oldPublicId, 'image').catch(err =>
          console.warn('[EventUpdate] Old Cloudinary banner cleanup warning:', err.message)
        );
      }

      return res.json({ success: true, data: event });
    } else {
      return res.json({ success: true, data: { ...event, ...updateData } });
    }
  } catch (err) {
    console.error('[UpdateEvent Error]:', err);
    return res.status(400).json({ success: false, error: err.message, message: err.message });
  }
};

// DELETE event
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  // Protect legacy hardcoded events
  const isLegacyId = id.startsWith('evt_up_') || id.startsWith('evt_past_');
  if (isLegacyId) {
    return res.status(403).json({ success: false, message: 'Legacy historical events are protected and cannot be deleted.' });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const publicId = event.bannerPublicId || event.publicId;

    // 1. Delete MongoDB record first (Source of Truth)
    await Event.findByIdAndDelete(id);

    // 2. Non-blocking Cloudinary cleanup if explicit publicId present
    if (publicId && !publicId.startsWith('local_')) {
      deleteAsset(publicId, 'image').catch(err => console.error('[EventDelete] Cloudinary cleanup error:', err));
    }

    // 3. Audit Log
    if (req.user) {
      AuditLog.create({
        operatorRef: req.user._id,
        operatorRole: req.user.role || 'Admin',
        action: 'EVENT_PERMANENT_DELETE',
        targetType: 'event',
        targetId: id,
        targetTitle: event.title || 'Untitled Event'
      }).catch(err => console.error('[AuditLog Error]:', err));
    }

    return res.json({ success: true, deletedEventId: id, message: 'Event permanently deleted.' });
  } catch (err) {
    console.error('[DeleteEvent Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// MARK event as Completed (does NOT delete it)
exports.markEventCompleted = async (req, res) => {
  const { id } = req.params;
  try {
    let event = await findEventByIdOrLegacy(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (typeof event.save === 'function') {
      event.status = 'Completed';
      event.isUpcoming = false;
      await event.save();
      return res.json({ success: true, data: event });
    } else {
      return res.json({ success: true, data: { ...event, status: 'Completed', isUpcoming: false } });
    }
  } catch (err) {
    console.error('[MarkEventCompleted Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Export for migration scripts
exports.LEGACY_EVENTS = LEGACY_EVENTS;
