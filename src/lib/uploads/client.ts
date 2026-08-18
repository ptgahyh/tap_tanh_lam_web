import type { MultipartPart, UploadedMediaInput } from '@/lib/uploads/types';

async function json<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body as T;
}

export function requestDirectUpload(file: File) {
  return json<{ uploadUrl: string; key: string; publicUrl: string | null }>('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size }),
  });
}

export function initMultipart(file: File) {
  return json<{ uploadId: string; key: string; partSize: number; publicUrl: string | null }>('/api/uploads/multipart/init', {
    method: 'POST',
    body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size }),
  });
}

export function presignMultipartPart(input: { key: string; uploadId: string; partNumber: number }) {
  return json<{ uploadUrl: string }>('/api/uploads/multipart/part', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function multipartStatus(input: { key: string; uploadId: string }) {
  return json<{ parts: MultipartPart[] }>('/api/uploads/multipart/status', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function completeMultipart(input: { key: string; uploadId: string; parts: MultipartPart[] }) {
  return json<{ key: string; publicUrl: string | null }>('/api/uploads/multipart/complete', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function abortMultipart(input: { key: string; uploadId: string }) {
  return json<{ success: true }>('/api/uploads/multipart/abort', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function publishPost(input: { caption: string; visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'; media: UploadedMediaInput[] }) {
  return json<{ postId: string; mediaIds: string[] }>('/api/posts/publish', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
