const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadMedia, uploadPdf, getMediaAssets, deleteMediaAsset, getMediaHealth, streamPdf } = require('../controllers/mediaController');
const { authMiddleware } = require('../middleware/auth');

// Ensure tmp directory exists
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

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// Accept both 'mediaFile' (Community Feed) and 'file' (Profile upload) field names
const uploadFields = upload.fields([
  { name: 'mediaFile', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

// Normalize: whichever field was provided, expose it as req.file
const normalizeFileField = (req, res, next) => {
  if (req.files) {
    req.file = req.files['mediaFile']?.[0] || req.files['file']?.[0] || null;
  }
  next();
};

router.get('/health', getMediaHealth);
router.get('/stream-pdf', streamPdf);
router.post('/upload', authMiddleware, uploadFields, normalizeFileField, uploadMedia);
// Dedicated PDF upload — uses resource_type:'raw' to produce correct delivery URL
router.post('/upload-pdf', authMiddleware, uploadFields, normalizeFileField, uploadPdf);
router.get('/', getMediaAssets);
router.delete('/:id', authMiddleware, deleteMediaAsset);

module.exports = router;
