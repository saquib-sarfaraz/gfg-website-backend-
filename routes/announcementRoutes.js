const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, togglePinAnnouncement } = require('../controllers/announcementController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.patch('/:id/pin', togglePinAnnouncement);
router.delete('/:id', deleteAnnouncement);

module.exports = router;
