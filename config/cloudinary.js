const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Log configuration status at module load (no secrets exposed)
const configured = isCloudinaryConfigured();
console.log(`[Cloudinary] Configuration detected: ${configured ? 'YES' : 'NO'}`);

const isDev = process.env.NODE_ENV === 'development';

/**
 * Uploads a file to Cloudinary and returns a normalized media object.
 *
 * Production behaviour:
 *   - Cloudinary success → normalized media object with secure_url
 *   - Cloudinary failure → throws error (no local fallback)
 *
 * Development behaviour:
 *   - Cloudinary success → normalized media object with secure_url
 *   - Cloudinary failure / not configured → local /uploads/ fallback
 *
 * @param {string} filePath   Absolute path to the temp file on disk
 * @param {string} folder     Cloudinary sub-folder (e.g. 'profiles', 'posts')
 * @returns {{ url, publicId, resourceType, format, width, height, bytes }}
 */
const uploadMediaAsset = async (filePath, folder = 'general') => {
  // ── Cloudinary upload ──────────────────────────────────────────────────────
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `gfg-cmp/${folder}`,
        resource_type: 'auto'
      });

      // Remove temp file after successful upload
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        width: result.width || null,
        height: result.height || null,
        bytes: result.bytes
      };
    } catch (err) {
      // Remove temp file on failure to avoid accumulation
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }

      if (!isDev) {
        // Production: propagate the error — do NOT fall back to local storage
        console.error('[Cloudinary] Upload failed in production:', err.message);
        throw new Error('Media upload failed. Please try again.');
      }

      // Development only: log warning and fall through to local fallback
      console.warn('[Cloudinary] Upload failed in development, falling back to local URL:', err.message);
    }
  } else if (!isDev) {
    // Production with no Cloudinary credentials configured → error
    throw new Error('Cloudinary is not configured. Media upload is unavailable.');
  }

  // ── Local fallback (development only) ────────────────────────────────────
  const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = path.basename(filePath);
  const destPath = path.join(uploadsDir, filename);

  if (filePath !== destPath && fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, destPath);
    fs.unlinkSync(filePath);
  }

  const stats = fs.existsSync(destPath) ? fs.statSync(destPath) : { size: 0 };
  const publicUrl = `/uploads/${folder}/${filename}`;

  console.warn(`[Cloudinary] DEV fallback — serving local URL: ${publicUrl}`);

  return {
    url: publicUrl,
    publicId: `local_${Date.now()}_${filename}`,
    resourceType: 'image',
    format: path.extname(filename).replace('.', ''),
    width: null,
    height: null,
    bytes: stats.size
  };
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadMediaAsset
};
