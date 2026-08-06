const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret'
});

const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
};

/**
 * Uploads file to Cloudinary if credentials present, otherwise saves to local upload folder
 */
const uploadMediaAsset = async (filePath, folder = 'general') => {
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `gfg-cmp/${folder}`,
        resource_type: 'auto'
      });
      // remove temp file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes
      };
    } catch (err) {
      console.warn('[Cloudinary] Upload failed, falling back to local URL:', err.message);
    }
  }

  // Fallback: move to public uploads directory
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

  return {
    url: publicUrl,
    publicId: `local_${Date.now()}_${filename}`,
    format: path.extname(filename).replace('.', ''),
    bytes: stats.size
  };
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadMediaAsset
};
