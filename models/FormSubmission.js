const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  communityId: { type: String, default: 'gfg-jamia-hamdard', index: true },
  answers: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
