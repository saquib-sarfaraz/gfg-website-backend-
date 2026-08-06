const express = require('express');
const router = express.Router();
const { getMantris, createMantri, updateMantri, setCurrentMantri, deleteMantri } = require('../controllers/mantriController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getMantris);
router.post('/', authMiddleware, createMantri);
router.put('/:id', authMiddleware, updateMantri);
router.patch('/:id/set-current', authMiddleware, setCurrentMantri);
router.delete('/:id', authMiddleware, deleteMantri);

module.exports = router;
