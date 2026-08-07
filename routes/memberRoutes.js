const express = require('express');
const router = express.Router();
const {
  getMembers, createMember, updateMember, deleteMember, importCSV,
  getProfile, updateSelfProfile, verifyMember, updateMembership, updateMemberStatus,
  getMyPosts, getMemberPosts, getPublicProfile, getPublicMemberPosts, getActiveMembers
} = require('../controllers/memberController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getMembers);
router.get('/active', getActiveMembers);
router.get('/me/posts', authMiddleware, getMyPosts);
router.get('/profile/:identifier/posts', getPublicMemberPosts);
router.get('/profile/:identifier', getPublicProfile);
router.get('/verify/:verificationId', verifyMember);
router.get('/:id/posts', getMemberPosts);
router.get('/:id/profile', getPublicProfile);
router.patch('/:id/profile', authMiddleware, updateSelfProfile);
router.patch('/:id/membership', authMiddleware, adminOnly, updateMembership);
router.patch('/:id/status', authMiddleware, adminOnly, updateMemberStatus);
router.post('/', authMiddleware, adminOnly, createMember);
router.put('/:id', authMiddleware, adminOnly, updateMember);
router.delete('/:id', authMiddleware, adminOnly, deleteMember);
router.post('/import', authMiddleware, adminOnly, importCSV);

module.exports = router;
