const MediaAsset = require('../models/MediaAsset');
const { uploadMediaAsset, uploadPdfAsset } = require('../config/cloudinary');

/**
 * POST /api/media/upload
 *
 * Accepts a multipart/form-data file (field: 'mediaFile' OR 'file') and
 * uploads it to Cloudinary (production) or local storage (development fallback).
 *
 * Normalized success response:
 * {
 *   success: true,
 *   media: {
 *     url, publicId, resourceType, format, width, height, bytes
 *   },
 *   data: { url, publicId, ... }    ← backward-compat alias
 * }
 *
 * Error response:
 * {
 *   success: false,
 *   message: '...'
 * }
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file attached' });
    }

    const folder = req.body.folder || 'General';

    let uploadResult;
    try {
      uploadResult = await uploadMediaAsset(req.file.path, folder);
    } catch (uploadErr) {
      // Cloudinary failed in production — do not persist anything
      return res.status(502).json({
        success: false,
        message: uploadErr.message || 'Media upload failed. Please try again.'
      });
    }

    // Persist asset record to MediaAsset collection for Media Library (safe fallback)
    let assetObj = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const asset = await MediaAsset.create({
          communityId: 'gfg-jamia-hamdard',
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          folder,
          filename: req.file.originalname,
          size: uploadResult.bytes || req.file.size,
          mimeType: req.file.mimetype
        });
        assetObj = asset ? asset.toObject() : null;
      }
    } catch (dbErr) {
      console.warn('[MediaController] MediaAsset database save skipped:', dbErr.message);
    }

    // Normalized payload — expose both `media` (canonical) and `data` (backward compat)
    const mediaPayload = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      resourceType: uploadResult.resourceType || 'image',
      format: uploadResult.format || '',
      width: uploadResult.width || null,
      height: uploadResult.height || null,
      bytes: uploadResult.bytes || 0
    };

    return res.status(201).json({
      success: true,
      media: mediaPayload,
      data: { ...(assetObj || {}), ...mediaPayload }
    });
  } catch (err) {
    console.error('[MediaController] uploadMedia error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/media/upload-pdf
 *
 * Dedicated PDF upload using resource_type:'raw' so Cloudinary returns a
 * raw/upload delivery URL. This is the only path that correctly delivers
 * PDFs with Content-Type: application/pdf in the browser.
 *
 * WHY NOT /upload: The generic /upload uses resource_type:'auto' which
 * causes Cloudinary to classify PDFs under 'image' and return image/upload
 * URLs. Browsers opening an image/upload PDF URL receive wrong headers and
 * report "Failed to load PDF document".
 */
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file attached' });
    }

    // Validate MIME type
    const mimeType = req.file.mimetype || '';
    const isPdf = mimeType === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return res.status(400).json({ success: false, message: 'Only PDF files are accepted on this endpoint.' });
    }

    const folder = req.body.folder || 'Resources';

    let uploadResult;
    try {
      uploadResult = await uploadPdfAsset(req.file.path, folder);
    } catch (uploadErr) {
      return res.status(502).json({
        success: false,
        message: uploadErr.message || 'PDF upload failed. Please try again.'
      });
    }

    // Verify we have a permanent URL before persisting
    if (!uploadResult?.url) {
      return res.status(502).json({ success: false, message: 'PDF upload did not return a permanent URL.' });
    }

    // Persist to MediaAsset collection for Media Library tracking (safe fallback)
    let assetObj = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const asset = await MediaAsset.create({
          communityId: 'gfg-jamia-hamdard',
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          folder,
          filename: req.file.originalname,
          size: uploadResult.bytes || req.file.size,
          mimeType: 'application/pdf'
        });
        assetObj = asset ? asset.toObject() : null;
      }
    } catch (dbErr) {
      console.warn('[MediaController] MediaAsset database save skipped for PDF:', dbErr.message);
    }

    const mediaPayload = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      resourceType: uploadResult.resourceType || 'raw',   // always 'raw' for PDFs
      format: uploadResult.format || 'pdf',
      bytes: uploadResult.bytes || 0
    };

    console.log(`[MediaController] PDF uploaded successfully: ${uploadResult.url}`);

    return res.status(201).json({
      success: true,
      media: mediaPayload,
      data: { ...(assetObj || {}), ...mediaPayload }
    });
  } catch (err) {
    console.error('[MediaController] uploadPdf error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMediaAssets = async (req, res) => {
  try {
    const { folder, search } = req.query;
    const filter = { communityId: 'gfg-jamia-hamdard' };

    if (folder && folder !== 'All') filter.folder = folder;
    if (search) filter.filename = { $regex: search, $options: 'i' };

    const assets = await MediaAsset.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: assets.length, data: assets });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteMediaAsset = async (req, res) => {
  try {
    await MediaAsset.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Media asset deleted from library' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const { isCloudinaryConfigured, cloudinary } = require('../config/cloudinary');
const https = require('https');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

exports.getMediaHealth = async (req, res) => {
  const configured = isCloudinaryConfigured();
  return res.json({
    success: true,
    configured,
    provider: 'cloudinary',
    status: configured ? 'connected' : 'local_fallback',
    environment: process.env.NODE_ENV || 'development'
  });
};

/**
 * GET /api/media/stream-pdf
 * Query params: publicId or url, download (boolean), filename
 * 
 * Streams PDF file directly with HTTP 200 OK + Content-Type: application/pdf
 */
exports.streamPdf = async (req, res) => {
  try {
    const { publicId, url, filename, download } = req.query;

    let targetPublicId = publicId || '';
    if (!targetPublicId && url) {
      const match = url.match(/\/gfg-cmp\/[^?#]+/);
      if (match) {
        targetPublicId = match[0].substring(1);
      }
    }

    const isDownloadMode = download === 'true' || download === '1';
    const dispositionFilename = filename || (targetPublicId ? path.basename(targetPublicId) : 'document.pdf');
    const safeFilename = dispositionFilename.endsWith('.pdf') ? dispositionFilename : `${dispositionFilename}.pdf`;

    // 1. Cloudinary stream extraction
    if (isCloudinaryConfigured() && targetPublicId && !targetPublicId.startsWith('local_')) {
      const timestamp = Math.floor(Date.now() / 1000);
      
      const fetchArchiveBuffer = (pubId, rType) => {
        return new Promise((resolve, reject) => {
          const archiveUrl = cloudinary.utils.download_archive_url({
            public_ids: [pubId],
            resource_type: rType,
            timestamp
          });

          https.get(archiveUrl, (cloudRes) => {
            if (cloudRes.statusCode !== 200) {
              return reject(new Error(`Cloudinary status ${cloudRes.statusCode}`));
            }
            const chunks = [];
            cloudRes.on('data', chunk => chunks.push(chunk));
            cloudRes.on('end', () => resolve(Buffer.concat(chunks)));
          }).on('error', reject);
        });
      };

      (async () => {
        try {
          let zipBuf;
          try {
            // Attempt raw first
            zipBuf = await fetchArchiveBuffer(targetPublicId, 'raw');
          } catch (_) {
            // Fallback to image
            const cleanId = targetPublicId.replace(/\.pdf$/, '');
            zipBuf = await fetchArchiveBuffer(cleanId, 'image');
          }

          const zip = new AdmZip(zipBuf);
          const pdfEntry = zip.getEntries().find(e => e.entryName.toLowerCase().endsWith('.pdf') || e.entryName.length > 0);

          if (!pdfEntry) {
            return res.status(404).json({ success: false, message: 'PDF asset stream not found' });
          }

          const pdfBuf = pdfEntry.getData();

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', pdfBuf.length);
          res.setHeader(
            'Content-Disposition',
            `${isDownloadMode ? 'attachment' : 'inline'}; filename="${encodeURIComponent(safeFilename)}"`
          );
          res.removeHeader('X-Frame-Options');
          res.setHeader('Content-Security-Policy', "frame-ancestors *");

          return res.status(200).send(pdfBuf);
        } catch (err) {
          console.error('[MediaController] PDF stream extraction failed:', err.message);
          return res.status(502).json({ success: false, message: 'PDF stream extraction failed: ' + err.message });
        }
      })();

      return;
    }

    // 2. Dev local storage fallback
    if (url && url.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, '..', url);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `${isDownloadMode ? 'attachment' : 'inline'}; filename="${encodeURIComponent(safeFilename)}"`
        );
        res.removeHeader('X-Frame-Options');
        return res.sendFile(localFilePath);
      }
    }

    return res.status(404).json({ success: false, message: 'PDF document not found' });
  } catch (err) {
    console.error('[MediaController] streamPdf error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
