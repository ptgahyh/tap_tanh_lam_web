import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { media, postMedia, posts } from '@/db/schema';
import { ensureDemoUser } from '@/lib/demo-user';
import type { UploadedMediaInput } from '@/lib/uploads/types';

const allowedVisibility = new Set(['PUBLIC', 'FOLLOWERS', 'PRIVATE']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const caption = typeof body.caption === 'string' ? body.caption.trim().slice(0, 5000) : '';
    const visibility = allowedVisibility.has(body.visibility) ? body.visibility : 'PUBLIC';
    const inputs: UploadedMediaInput[] = Array.isArray(body.media) ? body.media : [];

    if (!inputs.length || inputs.length > 20) {
      return NextResponse.json({ error: 'A post must contain 1 to 20 media files' }, { status: 400 });
    }
    if (inputs.some((item) => !item.key || !item.originalName || !/^(image|video)\//.test(item.mimeType) || !Number.isFinite(item.size) || item.size <= 0 || !['IMAGE', 'VIDEO'].includes(item.type))) {
      return NextResponse.json({ error: 'Invalid uploaded media data' }, { status: 400 });
    }

    const user = await ensureDemoUser();
    const result = await db.transaction(async (tx) => {
      const insertedMedia = await tx.insert(media).values(inputs.map((item) => ({
        ownerId: user.id,
        type: item.type,
        status: 'READY' as const,
        objectKey: item.key,
        originalName: item.originalName,
        mimeType: item.mimeType,
        size: item.size,
      }))).returning({ id: media.id });

      const [post] = await tx.insert(posts).values({
        authorId: user.id,
        caption: caption || null,
        visibility,
      }).returning({ id: posts.id });

      await tx.insert(postMedia).values(insertedMedia.map((item, index) => ({
        postId: post.id,
        mediaId: item.id,
        sortOrder: index,
      })));

      return { postId: post.id, mediaIds: insertedMedia.map((item) => item.id) };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('posts.publish', error);
    return NextResponse.json({ error: 'Could not publish post' }, { status: 500 });
  }
}
