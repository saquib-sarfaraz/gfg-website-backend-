const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent, markEventCompleted } = require('../controllers/eventController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, adminOnly, createEvent);
router.put('/:id', authMiddleware, adminOnly, updateEvent);
router.patch('/:id/complete', authMiddleware, adminOnly, markEventCompleted);
router.delete('/:id', authMiddleware, adminOnly, deleteEvent);

module.exports = router;
