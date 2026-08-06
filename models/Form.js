const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'email', 'phone', 'select', 'checkbox', 'file', 'date', 'textarea'],
    default: 'text'
  },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  options: [{ type: String }] // For select / checkbox inputs
});

const formSchema = new mongoose.Schema({
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fields: [fieldSchema],
  isPublished: { type: Boolean, default: true },
  submissionsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);
