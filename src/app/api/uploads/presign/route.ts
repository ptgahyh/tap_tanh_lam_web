import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUpload } from '@/lib/storage/r2';
import { ALLOWED_MEDIA_MIME, DIRECT_UPLOAD_THRESHOLD, safeObjectKey } from '@/lib/uploads/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const size = Number(body.size);

    if (!name || !ALLOWED_MEDIA_MIME.test(contentType)) {
      return NextResponse.json({ error: 'Unsupported media type' }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > DIRECT_UPLOAD_THRESHOLD) {
      return NextResponse.json({ error: 'Use multipart upload for files larger than 100 MiB' }, { status: 400 });
    }

    return NextResponse.json(await createPresignedUpload({
      key: safeObjectKey(name),
      contentType,
    }));
  } catch (error) {
    console.error('uploads.presign', error);
    return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 });
  }
}
