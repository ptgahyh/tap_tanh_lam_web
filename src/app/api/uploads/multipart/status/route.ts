import { NextRequest, NextResponse } from 'next/server';
import { listUploadedParts } from '@/lib/storage/r2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = typeof body.key === 'string' ? body.key : '';
    const uploadId = typeof body.uploadId === 'string' ? body.uploadId : '';
    if (!key || !uploadId) return NextResponse.json({ error: 'Missing multipart identity' }, { status: 400 });
    return NextResponse.json({ parts: await listUploadedParts({ key, uploadId }) });
  } catch (error) {
    console.error('uploads.multipart.status', error);
    return NextResponse.json({ error: 'Could not read multipart status' }, { status: 500 });
  }
}
