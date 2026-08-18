# LUMA Media Platform — Batch 2

Premium social photo/video starter built with Next.js 16, React 19, Tailwind, PostgreSQL/Drizzle, and Cloudflare R2.

## Current status

### Batch 1 — Foundation/UI ✅

- Responsive desktop/mobile shell.
- Home feed sample.
- Explore masonry gallery.
- Photos / Videos.
- Create page.
- Saved / Notifications / Messages / Profile / Settings placeholders.
- PostgreSQL social/media schema.

### Batch 2 — Media storage ✅

- Browser uploads directly to Cloudflare R2; media bytes do not pass through the Next.js server.
- Files up to 100 MiB use a presigned single PUT.
- Larger files automatically use resumable multipart upload with 10 MiB parts.
- Progress, pause/resume (current browser session), retry with backoff, and abort/remove.
- Multipart resume syncs uploaded parts from R2.
- Publish creates `media`, `posts`, and `post_media` records in one PostgreSQL transaction.
- Temporary demo user until Batch 3 Auth.

## 1. Install

```bash
cp .env.example .env.local
npm install
```

## 2. PostgreSQL

Create a PostgreSQL database, then set `DATABASE_URL` in `.env.local`.

Generate and apply schema migrations:

```bash
npm run db:generate
npm run db:migrate
```

## 3. Cloudflare R2

Create an R2 bucket and an R2 API token with object read/write permission for that bucket. Fill in:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

`R2_PUBLIC_BASE_URL` is optional for upload. Add it when the bucket has a public `r2.dev` URL or, preferably, your media custom domain.

### Required browser CORS

Apply a bucket CORS policy equivalent to `r2-cors.example.json`. Replace the production placeholder with your real domain. Keep `http://localhost:3000` while developing.

`ETag` must be exposed because multipart completion needs the exact ETag returned for each uploaded part.

## 4. Run

```bash
npm run dev
```

Open `http://localhost:3000/create` and choose images/videos.

## Temporary identity

Batch 2 has no login yet. Server APIs use these development-only values:

```env
DEMO_USER_ID=00000000-0000-4000-8000-000000000001
DEMO_USER_EMAIL=demo@luma.local
DEMO_USERNAME=luma_demo
```

The user row is created automatically on first publish. Batch 3 will remove this temporary flow and use the authenticated session instead.

## Upload behavior

- `<= 100 MiB`: direct presigned PUT. If paused, resume restarts that individual file from 0 because a single PUT is not resumable.
- `> 100 MiB`: multipart. Pause/retry keeps completed parts and continues from missing parts during the current browser session.
- Up to 20 media files per post in the current Create UI/API.

## Next batches

1. Foundation + UI ✅
2. Media/R2 direct upload + multipart + DB publish ✅
3. Auth + ownership/security
4. Social actions: like/comment/follow/save
5. Explore/search + real database feed
6. Profile
7. Notifications + Messages
8. Collections
9. Admin/moderation
10. Media processing, security/performance polish
