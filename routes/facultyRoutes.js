const express = require('express');
const router = express.Router();
const { getCoordinators, createCoordinator, updateCoordinator, deleteCoordinator } = require('../controllers/facultyController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getCoordinators);
router.post('/', authMiddleware, createCoordinator);
router.put('/:id', authMiddleware, updateCoordinator);
router.delete('/:id', authMiddleware, deleteCoordinator);

module.exports = router;
