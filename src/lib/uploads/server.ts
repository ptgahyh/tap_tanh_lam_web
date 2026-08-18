export const DIRECT_UPLOAD_THRESHOLD = 100 * 1024 * 1024; // 100 MiB
export const DEFAULT_MULTIPART_PART_SIZE = 10 * 1024 * 1024; // 10 MiB
export const MAX_MULTIPART_PART_SIZE = 5 * 1024 * 1024 * 1024; // 5 GiB
export const MAX_MULTIPART_PARTS = 10_000;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024 * 1024; // 5 TiB

export const ALLOWED_MEDIA_MIME = /^(image|video)\//;

export function safeObjectKey(name: string) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-160) || 'upload.bin';
  const date = new Date().toISOString().slice(0, 10);
  return `uploads/${date}/${crypto.randomUUID()}-${safe}`;
}

export function multipartPartSizeFor(fileSize: number) {
  const oneMiB = 1024 * 1024;
  const minimumForPartCount = Math.ceil(fileSize / MAX_MULTIPART_PARTS);
  const candidate = Math.max(DEFAULT_MULTIPART_PART_SIZE, minimumForPartCount);
  const rounded = Math.ceil(candidate / oneMiB) * oneMiB;
  return Math.min(MAX_MULTIPART_PART_SIZE, rounded);
}
