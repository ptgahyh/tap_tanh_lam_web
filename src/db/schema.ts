import { pgEnum, pgTable, text, timestamp, uuid, integer, bigint, boolean, primaryKey, index, jsonb } from 'drizzle-orm/pg-core';

export const mediaType = pgEnum('media_type', ['IMAGE', 'VIDEO']);
export const mediaStatus = pgEnum('media_status', ['UPLOADING', 'PROCESSING', 'READY', 'FAILED']);
export const postVisibility = pgEnum('post_visibility', ['PUBLIC', 'FOLLOWERS', 'PRIVATE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  name: text('name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  coverUrl: text('cover_url'),
  role: text('role').notNull().default('user'),
  banned: boolean('banned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: mediaType('type').notNull(),
  status: mediaStatus('status').notNull().default('UPLOADING'),
  objectKey: text('object_key').notNull().unique(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  durationMs: integer('duration_ms'),
  thumbnailKey: text('thumbnail_key'),
  blurHash: text('blur_hash'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [index('media_owner_created_idx').on(t.ownerId, t.createdAt), index('media_type_status_idx').on(t.type, t.status)]);

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  caption: text('caption'),
  visibility: postVisibility('visibility').notNull().default('PUBLIC'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [index('posts_author_created_idx').on(t.authorId, t.createdAt), index('posts_created_idx').on(t.createdAt)]);

export const postMedia = pgTable('post_media', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
}, t => [primaryKey({ columns: [t.postId, t.mediaId] })]);

export const follows = pgTable('follows', {
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [primaryKey({ columns: [t.followerId, t.followingId] })]);

export const postLikes = pgTable('post_likes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [primaryKey({ columns: [t.userId, t.postId] })]);

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [index('comments_post_created_idx').on(t.postId, t.createdAt)]);

export const savedPosts = pgTable('saved_posts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [primaryKey({ columns: [t.userId, t.postId] })]);
