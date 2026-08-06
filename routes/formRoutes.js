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
const { authMiddleware } = require('../middleware/auth');

router.get('/', getForms);
router.get('/:id', getFormById);
router.post('/', authMiddleware, createForm);
router.put('/:id', authMiddleware, updateForm);
router.delete('/:id', authMiddleware, deleteForm);
router.post('/:id/submit', submitFormResponse);
router.get('/:id/submissions', authMiddleware, getFormSubmissions);

module.exports = router;
