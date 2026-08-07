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

const getErrorMessage = (err) => {
  if (!err) return 'Unknown Cloudinary error';
  if (typeof err === 'string') return err;
  return err.message || err.error?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
};

/**
 * Uploads a file to Cloudinary and returns a normalized media object.
 */
const uploadMediaAsset = async (filePath, folder = 'general') => {
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `gfg-cmp/${folder}`,
        resource_type: 'auto'
      });

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
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
      const errMsg = getErrorMessage(err);
      console.warn('[Cloudinary] uploadMediaAsset failed, switching to local storage fallback:', errMsg);
    }
  } else {
    console.warn('[Cloudinary] Configuration missing — serving local storage path for media asset.');
  }

  // Guaranteed local storage fallback
  const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = path.basename(filePath);
  const destPath = path.join(uploadsDir, filename);

  if (filePath !== destPath && fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, destPath);
    try { fs.unlinkSync(filePath); } catch (_) {}
  }

  const stats = fs.existsSync(destPath) ? fs.statSync(destPath) : { size: 0 };
  const publicUrl = `/uploads/${folder}/${filename}`;

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

/**
 * Uploads a PDF file to Cloudinary with local storage fallback.
 */
const uploadPdfAsset = async (filePath, folder = 'Resources') => {
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `gfg-cmp/${folder}`,
        resource_type: 'raw'
      });

      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }

      console.log(`[Cloudinary] PDF uploaded as raw → ${result.secure_url}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format || 'pdf',
        bytes: result.bytes
      };
    } catch (err) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
      const errMsg = getErrorMessage(err);
      console.warn('[Cloudinary] uploadPdfAsset failed, switching to local storage fallback:', errMsg);
    }
  } else {
    console.warn('[Cloudinary] Configuration missing — serving local storage path for PDF asset.');
  }

  // Guaranteed local storage fallback
  const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = path.basename(filePath);
  const destPath = path.join(uploadsDir, filename);

  if (filePath !== destPath && fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, destPath);
    try { fs.unlinkSync(filePath); } catch (_) {}
  }

  const stats = fs.existsSync(destPath) ? fs.statSync(destPath) : { size: 0 };
  const publicUrl = `/uploads/${folder}/${filename}`;

  return {
    url: publicUrl,
    publicId: `local_${Date.now()}_${filename}`,
    resourceType: 'raw',
    format: 'pdf',
    bytes: stats.size
  };
};

const deleteMediaAssetFromCloudinary = async (publicId, resourceType = 'auto') => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`[Cloudinary] Asset ${publicId} deleted successfully.`);
  } catch (err) {
    console.warn(`[Cloudinary] Destroy asset failed for ${publicId}:`, err.message);
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadMediaAsset,
  uploadPdfAsset,
  deleteMediaAssetFromCloudinary
};
