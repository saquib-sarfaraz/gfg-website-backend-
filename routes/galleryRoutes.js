const express = require('express');
const router = express.Router();
const { getGalleryItems, createGalleryItem, createBatchGalleryItems, updateGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', getGalleryItems);
router.post('/', authMiddleware, adminOnly, createGalleryItem);
router.post('/batch', authMiddleware, adminOnly, createBatchGalleryItems);
router.put('/:id', authMiddleware, adminOnly, updateGalleryItem);
router.delete('/:id', authMiddleware, adminOnly, deleteGalleryItem);

module.exports = router;
