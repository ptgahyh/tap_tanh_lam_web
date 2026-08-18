import { NextRequest, NextResponse } from 'next/server';
import { createPresignedPartUpload } from '@/lib/storage/r2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = typeof body.key === 'string' ? body.key : '';
    const uploadId = typeof body.uploadId === 'string' ? body.uploadId : '';
    const partNumber = Number(body.partNumber);
    if (!key || !uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
      return NextResponse.json({ error: 'Invalid multipart part' }, { status: 400 });
    }
    return NextResponse.json(await createPresignedPartUpload({ key, uploadId, partNumber }));
  } catch (error) {
    console.error('uploads.multipart.part', error);
    return NextResponse.json({ error: 'Could not create part URL' }, { status: 500 });
  }
}
