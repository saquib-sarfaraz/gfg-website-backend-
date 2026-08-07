const express = require('express');
const router = express.Router();
const { getResources, createResource, updateResource, incrementDownloads, deleteResource } = require('../controllers/resourceController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getResources);
router.post('/', authMiddleware, adminOnly, createResource);
router.put('/:id', authMiddleware, adminOnly, updateResource);
router.patch('/:id/download', incrementDownloads);
router.delete('/:id', authMiddleware, adminOnly, deleteResource);

module.exports = router;
