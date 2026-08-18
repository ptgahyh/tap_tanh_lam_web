import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { env } from '@/lib/env';

/**
 * Temporary Batch 2 identity. Batch 3 replaces this with the authenticated user.
 * Keeping it server-side means the browser never gets to choose an ownerId.
 */
export async function ensureDemoUser() {
  const e = env();
  const id = e.DEMO_USER_ID;
  const existing = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      id,
      email: e.DEMO_USER_EMAIL,
      username: e.DEMO_USERNAME,
      name: 'LUMA Demo',
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;
  const raced = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!raced) throw new Error('Could not create demo user');
  return raced;
}
