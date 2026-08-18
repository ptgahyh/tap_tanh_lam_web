import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';

function client() {
  const e = env();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: e.R2_ACCESS_KEY_ID, secretAccessKey: e.R2_SECRET_ACCESS_KEY },
  });
}

export async function createPresignedUpload(input: { key: string; contentType: string }) {
  const e = env();
  const command = new PutObjectCommand({ Bucket: e.R2_BUCKET, Key: input.key, ContentType: input.contentType });
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn: 900 });
  return { uploadUrl, key: input.key, publicUrl: e.R2_PUBLIC_BASE_URL ? `${e.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${input.key}` : null };
}
