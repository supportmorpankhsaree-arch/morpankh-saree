import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizePathSegment(input: string): string {
  return String(input || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

function joinUrl(base: string, path: string): string {
  if (!base) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

async function uploadToCloudinary(buffer: Buffer, folder: string, filename?: string): Promise<string> {
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

  const safeFolder = sanitizePathSegment(folder) || 'uploads';
  const baseName = filename
    ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
    : `${Date.now()}-${randomSuffix()}`;

  const uploadOptions: UploadApiOptions = {
    folder: safeFolder,
    public_id: `${Date.now()}-${baseName}`,
    resource_type: 'image',
  };

  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    uploadOptions.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET.trim();
  }

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result?.secure_url) {
          return reject(new Error('Cloudinary upload did not return a secure URL'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

async function uploadToR2(buffer: Buffer, file: File, folder: string): Promise<string> {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY;
  const secretAccessKey = process.env.R2_SECRET_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new Error('Storage service is not configured. Please check R2 environment variables.');
  }

  const safeFolder = sanitizePathSegment(folder);
  const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
  const safeExt = String(ext || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const ts = Date.now();
  const key = safeExt
    ? `${safeFolder}/${ts}-${randomSuffix()}.${safeExt}`
    : `${safeFolder}/${ts}-${randomSuffix()}`;

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });

  await client.send(command);
  return joinUrl(publicBaseUrl, key);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    // ── Validate: file presence ──
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    // ── Validate: image type ──
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type: ${file.type}. Only images (JPEG, PNG, WebP, GIF, AVIF) are allowed.` },
        { status: 400 },
      );
    }

    // ── Validate: file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.` },
        { status: 400 },
      );
    }

    // ── Check storage providers ──
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );

    const hasR2 = Boolean(
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY &&
      process.env.R2_SECRET_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
    );

    if (!hasCloudinary && !hasR2) {
      return NextResponse.json(
        { success: false, error: 'Storage service is not configured. Please check Cloudinary or R2 environment variables in .env' },
        { status: 500 },
      );
    }

    // ── Read file into buffer ──
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let url: string;

    if (hasCloudinary) {
      try {
        url = await uploadToCloudinary(buffer, folder, file.name);
      } catch (cloudErr: unknown) {
        console.error('Cloudinary upload error:', cloudErr);

        if (hasR2) {
          console.warn('Falling back to Cloudflare R2 upload...');
          url = await uploadToR2(buffer, file, folder);
        } else {
          const cloudErrObj = cloudErr as { message?: string; error?: { message?: string }; http_code?: number } | null | undefined;
          const rawMsg = cloudErrObj?.message || (cloudErrObj?.error?.message ?? 'Cloudinary upload failed');
          let userMsg = rawMsg;
          if (typeof rawMsg === 'string' && (rawMsg.includes('Invalid cloud_name') || rawMsg.includes('cloud_name mismatch'))) {
            userMsg = `${rawMsg}. Note: In Cloudinary, your Cloud Name cannot contain spaces and must match the Cloud Name shown in your Cloudinary Dashboard.`;
          } else if (typeof rawMsg === 'string' && (rawMsg.includes('403') || rawMsg.includes('missing permissions') || rawMsg.includes('forbidden') || cloudErrObj?.http_code === 403)) {
            userMsg = `Permission Denied (403): The API Key does not have upload permissions. In Cloudinary Console under Settings > API Keys, click '+ Generate New API Key' with 'Full Access' (or ensure 'create' permission is checked), then update the API Key and Secret in .env.`;
          }
          return NextResponse.json(
            { success: false, error: `Cloudinary upload error: ${userMsg}` },
            { status: 500 },
          );
        }
      }
    } else {
      url = await uploadToR2(buffer, file, folder);
    }

    console.log('Image uploaded successfully:', { url, size: file.size, type: file.type });
    return NextResponse.json({ success: true, url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    console.error('Image upload failed:', {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: `Upload failed: ${message}` },
      { status: 500 },
    );
  }
}

