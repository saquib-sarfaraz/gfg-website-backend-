const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  legacyId: { type: String, unique: true, sparse: true }, // Links to GFG-CMP-Content legacy event
  source: { type: String, enum: ['legacy', 'admin', 'cloudinary'], default: 'admin' },
  banner: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: mongoose.Schema.Types.Mixed, required: true }, // String for legacy dates, Date for new
  venue: { type: String, default: '' },
  registrationLink: { type: String, default: '' },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form' }, // Linked dynamic form
  speaker: { type: String, default: '' },
  partner: { type: String, default: '' },
  prizePool: { type: String, default: '' },
  category: { type: String, default: '' },
  isUpcoming: { type: Boolean, default: true },
  speakers: [{
    name: { type: String },
    role: { type: String },
    avatar: { type: String }
  }],
  gallery: [{ type: String }], // Array of image URLs from event
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Registration Open', 'Announced', 'Planning', 'Live', 'Completed', 'Archived'],
    default: 'Registration Open'
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
