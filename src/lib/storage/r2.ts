import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  type CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';

let cachedClient: S3Client | null = null;

export function r2Client() {
  if (cachedClient) return cachedClient;
  const e = env();
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: e.R2_ACCESS_KEY_ID,
      secretAccessKey: e.R2_SECRET_ACCESS_KEY,
    },
  });
  return cachedClient;
}

export function publicUrlForKey(key: string) {
  const base = env().R2_PUBLIC_BASE_URL?.replace(/\/$/, '');
  return base ? `${base}/${key}` : null;
}

export async function createPresignedUpload(input: { key: string; contentType: string }) {
  const e = env();
  const command = new PutObjectCommand({
    Bucket: e.R2_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
  });
  const uploadUrl = await getSignedUrl(r2Client(), command, { expiresIn: 900 });
  return { uploadUrl, key: input.key, publicUrl: publicUrlForKey(input.key) };
}

export async function beginMultipartUpload(input: { key: string; contentType: string }) {
  const e = env();
  const result = await r2Client().send(new CreateMultipartUploadCommand({
    Bucket: e.R2_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
  }));
  if (!result.UploadId) throw new Error('R2 did not return an uploadId');
  return { uploadId: result.UploadId, key: input.key, publicUrl: publicUrlForKey(input.key) };
}

export async function createPresignedPartUpload(input: {
  key: string;
  uploadId: string;
  partNumber: number;
}) {
  const e = env();
  const command = new UploadPartCommand({
    Bucket: e.R2_BUCKET,
    Key: input.key,
    UploadId: input.uploadId,
    PartNumber: input.partNumber,
  });
  const uploadUrl = await getSignedUrl(r2Client(), command, { expiresIn: 900 });
  return { uploadUrl };
}

export async function listUploadedParts(input: { key: string; uploadId: string }) {
  const e = env();
  const uploaded: Array<{ partNumber: number; etag: string }> = [];
  let marker: string | undefined;

  do {
    const result = await r2Client().send(new ListPartsCommand({
      Bucket: e.R2_BUCKET,
      Key: input.key,
      UploadId: input.uploadId,
      PartNumberMarker: marker,
    }));
    uploaded.push(...(result.Parts ?? [])
      .filter((part) => part.PartNumber && part.ETag)
      .map((part) => ({ partNumber: part.PartNumber!, etag: part.ETag! })));
    marker = result.IsTruncated && result.NextPartNumberMarker
      ? String(result.NextPartNumberMarker)
      : undefined;
  } while (marker);

  return uploaded;
}

export async function finishMultipartUpload(input: {
  key: string;
  uploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
}) {
  const e = env();
  const parts: CompletedPart[] = [...input.parts]
    .sort((a, b) => a.partNumber - b.partNumber)
    .map((part) => ({ PartNumber: part.partNumber, ETag: part.etag }));

  await r2Client().send(new CompleteMultipartUploadCommand({
    Bucket: e.R2_BUCKET,
    Key: input.key,
    UploadId: input.uploadId,
    MultipartUpload: { Parts: parts },
  }));
  return { key: input.key, publicUrl: publicUrlForKey(input.key) };
}

export async function cancelMultipartUpload(input: { key: string; uploadId: string }) {
  const e = env();
  await r2Client().send(new AbortMultipartUploadCommand({
    Bucket: e.R2_BUCKET,
    Key: input.key,
    UploadId: input.uploadId,
  }));
}
