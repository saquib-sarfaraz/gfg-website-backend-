const express = require('express');
const router = express.Router();
const { getCoordinators, createCoordinator, updateCoordinator, deleteCoordinator } = require('../controllers/facultyController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getCoordinators);
router.post('/', authMiddleware, adminOnly, createCoordinator);
router.put('/:id', authMiddleware, adminOnly, updateCoordinator);
router.delete('/:id', authMiddleware, adminOnly, deleteCoordinator);

module.exports = router;
