const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');

exports.getForms = async (req, res) => {
  try {
    const forms = await Form.find({ communityId: 'gfg-jamia-hamdard' }).sort({ createdAt: -1 });
    return res.json({ success: true, data: forms });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    return res.json({ success: true, data: form });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createForm = async (req, res) => {
  try {
    const form = await Form.create(req.body);
    return res.status(201).json({ success: true, data: form });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    return res.json({ success: true, data: form });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    await Form.findByIdAndDelete(req.params.id);
    await FormSubmission.deleteMany({ formId: req.params.id });
    return res.json({ success: true, message: 'Form and submissions deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Submit dynamic form
exports.submitFormResponse = async (req, res) => {
  try {
    const formId = req.params.id;
    const form = await Form.findById(formId);
    if (!form || !form.isPublished) {
      return res.status(404).json({ success: false, message: 'Form is closed or does not exist' });
    }

    const submission = await FormSubmission.create({
      formId,
      communityId: 'gfg-jamia-hamdard',
      answers: req.body.answers || req.body
    });

    await Form.findByIdAndUpdate(formId, { $inc: { submissionsCount: 1 } });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your response has been recorded successfully.',
      submissionId: submission._id
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// View submissions for a form
exports.getFormSubmissions = async (req, res) => {
  try {
    const formId = req.params.id;
    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const submissions = await FormSubmission.find({ formId }).sort({ submittedAt: -1 });
    return res.json({ success: true, formTitle: form.title, fields: form.fields, submissions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
