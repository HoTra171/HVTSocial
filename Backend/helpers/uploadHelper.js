import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Upload file to Cloudinary with automatic fallback to local disk storage.
 * Prevents "Must supply api_key" crashes when Cloudinary credentials are not set.
 *
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @param {string} originalName
 * @param {object|array} transformation
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export const uploadMedia = async (fileBuffer, folder = 'general', nameOrTransformation = '', maybeTransformation = null) => {
  let originalName = '';
  let transformation = null;

  if (typeof nameOrTransformation === 'string') {
    originalName = nameOrTransformation;
    transformation = maybeTransformation;
  } else if (nameOrTransformation && (typeof nameOrTransformation === 'object' || Array.isArray(nameOrTransformation))) {
    transformation = nameOrTransformation;
    originalName = typeof maybeTransformation === 'string' ? maybeTransformation : '';
  }

  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_API_KEY.includes('your_')
  );

  if (hasCloudinary) {
    try {
      const url = await new Promise((resolve, reject) => {
        try {
          const stream = Readable.from(fileBuffer);
          const options = {
            resource_type: 'auto',
            folder: `hvtsocial/${folder}`,
            transformation: transformation || undefined,
          };
          const uploadStream = cloudinary.uploader.upload_stream(options, (err, res) => {
            if (err) return reject(err);
            resolve(res.secure_url);
          });
          stream.pipe(uploadStream);
        } catch (streamErr) {
          reject(streamErr);
        }
      });
      console.log(`[Upload] Uploaded to Cloudinary (${folder}):`, url);
      return url;
    } catch (err) {
      console.warn(`[Upload] Cloudinary upload failed (${err.message}). Using local storage fallback.`);
    }
  }

  // Local Storage Fallback: writes to /uploads/<folder>/<filename>
  const uploadDir = path.resolve(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = (typeof originalName === 'string' && originalName) ? path.extname(originalName) || '.jpg' : '.jpg';
  const fileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, fileBuffer);

  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  const localUrl = `${serverUrl}/uploads/${folder}/${fileName}`;
  console.log(`[Upload] Saved locally (${folder}):`, localUrl);
  return localUrl;
};
