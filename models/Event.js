const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  banner: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  registrationLink: { type: String, default: '' },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form' }, // Linked dynamic form
  speakers: [{
    name: { type: String },
    role: { type: String },
    avatar: { type: String }
  }],
  gallery: [{ type: String }], // Array of image URLs from event
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Registration Open', 'Live', 'Completed', 'Archived'],
    default: 'Registration Open'
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
