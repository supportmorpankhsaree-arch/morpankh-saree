export type R2PresignResponse = {
  uploadUrl: string;
  fileUrl: string;
  key?: string;
};

export type UploadToR2Options = {
  folder?: string;
  maxBytes?: number;
  onProgress?: (percent: number) => void;
};

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export async function uploadToR2(file: File, options: UploadToR2Options = {}): Promise<string> {
  const { folder = 'uploads', maxBytes = DEFAULT_MAX_BYTES, onProgress } = options;

  if (!file) throw new Error('No file provided');
  if (!file.type?.startsWith('image/')) throw new Error('Only image uploads are allowed');
  if (typeof file.size === 'number' && file.size > maxBytes) throw new Error('File too large');

  const presignRes = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      folder,
    }),
  });

  if (!presignRes.ok) {
    const msg = await presignRes.text().catch(() => '');
    throw new Error(msg || 'Failed to get upload URL');
  }

  const { uploadUrl, fileUrl } = (await presignRes.json()) as R2PresignResponse;
  if (!uploadUrl || !fileUrl) throw new Error('Invalid upload URL response');

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      if (!event.lengthComputable) return;
      const pct = Math.round((event.loaded / event.total) * 100);
      onProgress(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });

  return fileUrl;
}
