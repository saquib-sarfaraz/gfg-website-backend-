const express = require('express');
const router = express.Router();
const { getMantris, createMantri, updateMantri, setCurrentMantri, deleteMantri } = require('../controllers/mantriController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getMantris);
router.post('/', authMiddleware, adminOnly, createMantri);
router.put('/:id', authMiddleware, adminOnly, updateMantri);
router.patch('/:id/set-current', authMiddleware, adminOnly, setCurrentMantri);
router.delete('/:id', authMiddleware, adminOnly, deleteMantri);

module.exports = router;
