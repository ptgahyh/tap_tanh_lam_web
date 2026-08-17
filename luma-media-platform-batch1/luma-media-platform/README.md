# LUMA Media Platform — Batch 1

Starter cho web social ảnh/video theo hướng premium: Next.js + React + Tailwind + PostgreSQL/Drizzle + Cloudflare R2.

## Batch này đã có

- UI shell desktop + mobile.
- Home feed mẫu.
- Explore masonry gallery.
- Videos / Photos.
- Create page với chọn nhiều ảnh/video và preview danh sách.
- Placeholder cho Saved / Notifications / Messages / Profile / Settings.
- Schema PostgreSQL cho User, Media, Post, Follow, Like, Comment, Saved.
- Cloudflare R2 presigned upload endpoint (`/api/uploads/presign`).
- `.env.example`.

## Chưa nối ở Batch 1

- Auth thật.
- Database query thật.
- Upload trực tiếp từ browser vào R2.
- Multipart upload cho video lớn.
- FFmpeg/thumbnail worker.
- Like/comment/follow thật.
- Admin.

## Chạy local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Truy cập `http://localhost:3000`.

## Storage

Primary: Cloudflare R2. Google Drive chỉ nên dùng cho backup/export; không dùng làm delivery layer cho feed ảnh/video public.

## Lộ trình tiếp theo

1. Foundation + UI shell ✅
2. Media storage: direct R2 upload + multipart + metadata
3. Social: post/like/comment/follow/save
4. Explore/search
5. Profile
6. Notifications + Messages
7. Collections
8. Admin
9. Polish/security/performance
