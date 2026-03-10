import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ==================== USERS ====================
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // bcrypt 해시 (최소 8자)
  nickname: text("nickname").notNull(),
  profileImage: text("profile_image"), // R2 URL
  role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
  biometricEnabled: integer("biometric_enabled", { mode: "boolean" }).default(false),
  fcmToken: text("fcm_token"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== SESSIONS ====================
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== FEEDS ====================
export const feeds = sqliteTable("feeds", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== FEED MEDIA ====================
export const feedMedia = sqliteTable("feed_media", {
  id: text("id").primaryKey(),
  feedId: text("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(), // R2 URL
  mediaType: text("media_type", { enum: ["image", "video"] }).notNull(),
  order: integer("order").default(0),
});

// ==================== FEED LIKES ====================
export const feedLikes = sqliteTable("feed_likes", {
  id: text("id").primaryKey(),
  feedId: text("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== FEED COMMENTS ====================
export const feedComments = sqliteTable("feed_comments", {
  id: text("id").primaryKey(),
  feedId: text("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id"), // 대댓글: 부모 댓글 ID (null이면 루트 댓글)
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== COMMENT LIKES ====================
export const commentLikes = sqliteTable("comment_likes", {
  id: text("id").primaryKey(),
  commentId: text("comment_id")
    .notNull()
    .references(() => feedComments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== CALENDAR EVENTS ====================
export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  isAllDay: integer("is_all_day", { mode: "boolean" }).default(false),
  isDday: integer("is_dday", { mode: "boolean" }).default(false),
  placeName: text("place_name"),
  placeAddress: text("place_address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  naverPlaceId: text("naver_place_id"),
  notifyBefore: integer("notify_before"), // 분 단위
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== NOTIFICATIONS ====================
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["feed", "calendar", "system"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: text("data"), // JSON string
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  feeds: many(feeds),
  feedLikes: many(feedLikes),
  feedComments: many(feedComments),
  calendarEvents: many(calendarEvents),
  notifications: many(notifications),
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  user: one(users, { fields: [feeds.userId], references: [users.id] }),
  media: many(feedMedia),
  likes: many(feedLikes),
  comments: many(feedComments),
}));

export const feedMediaRelations = relations(feedMedia, ({ one }) => ({
  feed: one(feeds, { fields: [feedMedia.feedId], references: [feeds.id] }),
}));

export const feedLikesRelations = relations(feedLikes, ({ one }) => ({
  feed: one(feeds, { fields: [feedLikes.feedId], references: [feeds.id] }),
  user: one(users, { fields: [feedLikes.userId], references: [users.id] }),
}));

export const feedCommentsRelations = relations(feedComments, ({ one, many }) => ({
  feed: one(feeds, { fields: [feedComments.feedId], references: [feeds.id] }),
  user: one(users, { fields: [feedComments.userId], references: [users.id] }),
  parent: one(feedComments, { fields: [feedComments.parentId], references: [feedComments.id] }),
  likes: many(commentLikes),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(feedComments, { fields: [commentLikes.commentId], references: [feedComments.id] }),
  user: one(users, { fields: [commentLikes.userId], references: [users.id] }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, { fields: [calendarEvents.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
