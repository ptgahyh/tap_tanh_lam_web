# LUMA Batch 2 — Media/R2

## Added

- Direct browser → Cloudflare R2 upload using presigned PUT URLs.
- Upload progress using XMLHttpRequest.
- Automatic retry with exponential backoff.
- Large-file multipart upload (>100 MiB) using 10 MiB uniform parts.
- Pause/resume during the current browser session.
- Multipart status sync from R2 so already-uploaded parts are skipped on resume/retry.
- Multipart abort when an item is removed.
- PostgreSQL/Drizzle connection.
- Publish API that creates Media + Post + PostMedia records in one transaction.
- Temporary server-side demo identity until Auth is implemented in Batch 3.
- R2 CORS example with `ETag` exposed for multipart completion.

## Important

Batch 2 is development-ready but not authentication-ready. `/api/posts/publish` currently assigns posts to the configured demo user. Batch 3 will replace this with the authenticated session and add authorization/rate limiting.
