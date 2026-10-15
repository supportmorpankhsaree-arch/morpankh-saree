import { NextRequest, NextResponse } from 'next/server';
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

    // ── Validate: R2 environment variables ──
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY;
    const secretAccessKey = process.env.R2_SECRET_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_URL;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
      console.error('R2 upload failed: Missing environment variables', {
        hasEndpoint: !!endpoint,
        hasAccessKey: !!accessKeyId,
        hasSecretKey: !!secretAccessKey,
        hasBucket: !!bucket,
        hasPublicUrl: !!publicBaseUrl,
      });
      return NextResponse.json(
        { success: false, error: 'Storage service is not configured. Please check R2 environment variables.' },
        { status: 500 },
      );
    }

    // ── Build object key ──
    const safeFolder = sanitizePathSegment(folder);
    const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
    const safeExt = String(ext || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const ts = Date.now();
    const key = safeExt
      ? `${safeFolder}/${ts}-${randomSuffix()}.${safeExt}`
      : `${safeFolder}/${ts}-${randomSuffix()}`;

    // ── Read file into buffer ──
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Upload to R2 ──
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

    const url = joinUrl(publicBaseUrl, key);

    console.log('Image uploaded successfully:', { key, url, size: file.size, type: file.type });

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
