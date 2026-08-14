const express = require('express');
const router = express.Router();
const {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  assignMember,
  removeMember
} = require('../controllers/teamController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getTeams);
router.post('/', authMiddleware, adminOnly, createTeam);
router.put('/:id', authMiddleware, adminOnly, updateTeam);
router.delete('/:id', authMiddleware, adminOnly, deleteTeam);
router.post('/:id/assign', authMiddleware, adminOnly, assignMember);
router.post('/:id/remove-member', authMiddleware, adminOnly, removeMember);

module.exports = router;
