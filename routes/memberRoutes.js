const express = require('express');
const router = express.Router();
const {
  getMembers, createMember, updateMember, deleteMember, importCSV,
  getProfile, updateSelfProfile, verifyMember, updateMembership, updateMemberStatus
} = require('../controllers/memberController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getMembers);
router.get('/verify/:verificationId', verifyMember);
router.get('/:id/profile', getProfile);
router.patch('/:id/profile', updateSelfProfile);
router.patch('/:id/membership', updateMembership);
router.patch('/:id/status', updateMemberStatus);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);
router.post('/import', importCSV);

module.exports = router;
