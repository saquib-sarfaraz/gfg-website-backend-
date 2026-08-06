const express = require('express');
const router = express.Router();
const { getGalleryItems, createGalleryItem, createBatchGalleryItems, updateGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getGalleryItems);
router.post('/', createGalleryItem);
router.post('/batch', createBatchGalleryItems);
router.put('/:id', updateGalleryItem);
router.delete('/:id', deleteGalleryItem);

module.exports = router;
