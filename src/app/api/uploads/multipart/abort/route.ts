import { NextRequest, NextResponse } from 'next/server';
import { cancelMultipartUpload } from '@/lib/storage/r2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = typeof body.key === 'string' ? body.key : '';
    const uploadId = typeof body.uploadId === 'string' ? body.uploadId : '';
    if (!key || !uploadId) return NextResponse.json({ error: 'Missing multipart identity' }, { status: 400 });
    await cancelMultipartUpload({ key, uploadId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('uploads.multipart.abort', error);
    return NextResponse.json({ error: 'Could not abort multipart upload' }, { status: 500 });
  }
}
