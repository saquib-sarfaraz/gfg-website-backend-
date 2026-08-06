const express = require('express');
const router = express.Router();
const { getResources, createResource, updateResource, incrementDownloads, deleteResource } = require('../controllers/resourceController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getResources);
router.post('/', authMiddleware, createResource);
router.put('/:id', authMiddleware, updateResource);
router.patch('/:id/download', incrementDownloads);
router.delete('/:id', authMiddleware, deleteResource);

module.exports = router;
