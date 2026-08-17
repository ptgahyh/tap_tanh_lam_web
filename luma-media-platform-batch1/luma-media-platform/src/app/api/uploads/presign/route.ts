import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUpload } from '@/lib/storage/r2';

const allowed = /^(image|video)\//;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    if (!name || !allowed.test(contentType)) return NextResponse.json({ error: 'Unsupported media type' }, { status: 400 });
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-160);
    const key = `uploads/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safe}`;
    return NextResponse.json(await createPresignedUpload({ key, contentType }));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 });
  }
}
