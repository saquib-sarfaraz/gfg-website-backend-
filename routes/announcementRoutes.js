const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, togglePinAnnouncement } = require('../controllers/announcementController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getAnnouncements);
router.post('/', authMiddleware, adminOnly, createAnnouncement);
router.put('/:id', authMiddleware, adminOnly, updateAnnouncement);
router.patch('/:id/pin', authMiddleware, adminOnly, togglePinAnnouncement);
router.delete('/:id', authMiddleware, adminOnly, deleteAnnouncement);

module.exports = router;
