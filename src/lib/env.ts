import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().url().optional().or(z.literal('')),
  DEMO_USER_ID: z.string().uuid().default('00000000-0000-4000-8000-000000000001'),
  DEMO_USER_EMAIL: z.string().email().default('demo@luma.local'),
  DEMO_USERNAME: z.string().min(2).default('luma_demo'),
});

export const env = () => schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  DEMO_USER_ID: process.env.DEMO_USER_ID,
  DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL,
  DEMO_USERNAME: process.env.DEMO_USERNAME,
});
