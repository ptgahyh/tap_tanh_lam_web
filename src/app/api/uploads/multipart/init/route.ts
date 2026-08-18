import { NextRequest, NextResponse } from 'next/server';
import { beginMultipartUpload } from '@/lib/storage/r2';
import { ALLOWED_MEDIA_MIME, DIRECT_UPLOAD_THRESHOLD, MAX_UPLOAD_BYTES, multipartPartSizeFor, safeObjectKey } from '@/lib/uploads/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const size = Number(body.size);

    if (!name || !ALLOWED_MEDIA_MIME.test(contentType)) {
      return NextResponse.json({ error: 'Unsupported media type' }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= DIRECT_UPLOAD_THRESHOLD || size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Invalid multipart file size' }, { status: 400 });
    }

    const result = await beginMultipartUpload({ key: safeObjectKey(name), contentType });
    return NextResponse.json({ ...result, partSize: multipartPartSizeFor(size) });
  } catch (error) {
    console.error('uploads.multipart.init', error);
    return NextResponse.json({ error: 'Could not start multipart upload' }, { status: 500 });
  }
}
