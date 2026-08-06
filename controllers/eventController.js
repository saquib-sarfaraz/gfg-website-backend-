const mongoose = require('mongoose');
const Event = require('../models/Event');

const MOCK_EVENTS = [
  {
    _id: 'e1',
    title: 'AI & Machine Learning Workshop 2026',
    description: 'Hands-on session on PyTorch, Transformers, and LLM fine-tuning guided by senior ML researchers.',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    date: new Date('2026-08-15T10:00:00.000Z'),
    venue: 'Auditorium 2, Jamia Hamdard',
    registrationLink: 'https://docs.google.com/forms/d/e/1FAIpQLSc_sample_ai_workshop/viewform',
    status: 'Registration Open'
  },
  {
    _id: 'e2',
    title: 'GeeksforGeeks Chapter Induction 2026',
    description: 'Meet the executive body, explore technical chapters, and learn how to contribute to community open-source projects.',
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    date: new Date('2026-07-20T11:00:00.000Z'),
    venue: 'Main Campus Convention Center',
    registrationLink: 'https://docs.google.com/forms/d/e/1FAIpQLSc_sample_induction/viewform',
    status: 'Completed'
  }
];

exports.getEvents = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, count: MOCK_EVENTS.length, data: MOCK_EVENTS });
  }

  try {
    const { status } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };
    if (status && status !== 'All') {
      filter.status = status;
    }
    const events = await Event.find(filter).sort({ date: -1 });
    return res.json({ success: true, count: events.length, data: events.length > 0 ? events : MOCK_EVENTS });
  } catch (err) {
    return res.json({ success: true, count: MOCK_EVENTS.length, data: MOCK_EVENTS });
  }
};

exports.getEventById = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const event = MOCK_EVENTS.find(e => e._id === req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, data: event });
  }

  try {
    const event = await Event.findById(req.params.id).populate('formId');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const newDoc = { _id: `e_${Date.now()}`, ...req.body, status: req.body.status || 'Registration Open' };
    MOCK_EVENTS.unshift(newDoc);
    return res.status(201).json({ success: true, data: newDoc });
  }

  try {
    const event = await Event.create(req.body);
    return res.status(201).json({ success: true, data: event });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_EVENTS.findIndex(e => e._id === req.params.id);
    if (idx !== -1) {
      MOCK_EVENTS[idx] = { ...MOCK_EVENTS[idx], ...req.body };
      return res.json({ success: true, data: MOCK_EVENTS[idx] });
    }
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, data: event });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = MOCK_EVENTS.findIndex(e => e._id === req.params.id);
    if (idx !== -1) MOCK_EVENTS.splice(idx, 1);
    return res.json({ success: true, message: 'Event deleted' });
  }

  try {
    await Event.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.markEventCompleted = async (req, res) => {
  const { id } = req.params;
  if (mongoose.connection.readyState !== 1) {
    const event = MOCK_EVENTS.find(e => e._id === id);
    if (event) {
      event.status = 'Completed';
      return res.json({ success: true, data: event });
    }
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    event.status = 'Completed';
    await event.save();
    return res.json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
