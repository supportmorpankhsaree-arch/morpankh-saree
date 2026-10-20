import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config(true);
}
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
  });
}
cloudinary.config({ secure: true });

export async function uploadImage(file: File | Buffer, folder = 'categories'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'image',
      format: 'webp',
      quality: 'auto',
      fetch_format: 'auto',
    };
    if (process.env.CLOUDINARY_UPLOAD_PRESET) {
      uploadOptions.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET.trim();
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    if (file instanceof File) {
      file.arrayBuffer().then(buffer => {
        uploadStream.end(Buffer.from(buffer));
      }).catch(reject);
    } else {
      uploadStream.end(file);
    }
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
}
