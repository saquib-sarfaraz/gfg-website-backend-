const express = require('express');
const router = express.Router();
const {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  submitFormResponse,
  getFormSubmissions
} = require('../controllers/formController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getForms);
router.get('/:id', getFormById);
router.post('/', authMiddleware, adminOnly, createForm);
router.put('/:id', authMiddleware, adminOnly, updateForm);
router.delete('/:id', authMiddleware, adminOnly, deleteForm);
router.post('/:id/submit', submitFormResponse);
router.get('/:id/submissions', authMiddleware, adminOnly, getFormSubmissions);

module.exports = router;
