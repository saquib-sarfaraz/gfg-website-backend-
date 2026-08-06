const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent, markEventCompleted } = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.patch('/:id/complete', authMiddleware, markEventCompleted);
router.delete('/:id', authMiddleware, deleteEvent);

module.exports = router;
