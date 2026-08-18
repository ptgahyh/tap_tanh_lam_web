import { NextRequest, NextResponse } from 'next/server';
import { finishMultipartUpload } from '@/lib/storage/r2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = typeof body.key === 'string' ? body.key : '';
    const uploadId = typeof body.uploadId === 'string' ? body.uploadId : '';
    const parts = Array.isArray(body.parts) ? body.parts : [];
    if (!key || !uploadId || !parts.length) return NextResponse.json({ error: 'Missing multipart completion data' }, { status: 400 });
    if (parts.some((p) => !Number.isInteger(p.partNumber) || p.partNumber < 1 || typeof p.etag !== 'string' || !p.etag)) {
      return NextResponse.json({ error: 'Invalid multipart parts' }, { status: 400 });
    }
    return NextResponse.json(await finishMultipartUpload({ key, uploadId, parts }));
  } catch (error) {
    console.error('uploads.multipart.complete', error);
    return NextResponse.json({ error: 'Could not complete multipart upload' }, { status: 500 });
  }
}
