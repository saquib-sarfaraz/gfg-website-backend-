const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadMedia, getMediaAssets, deleteMediaAsset } = require('../controllers/mediaController');
const { authMiddleware } = require('../middleware/auth');

// Multer temporary storage
const tmpDir = path.join(__dirname, '..', 'uploads', 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/upload', authMiddleware, upload.single('mediaFile'), uploadMedia);
router.get('/', getMediaAssets);
router.delete('/:id', authMiddleware, deleteMediaAsset);

module.exports = router;
