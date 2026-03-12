import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ==================== USERS ====================
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nickname: text("nickname").notNull(),
  profileImage: text("profile_image"),
  role: text("role", { enum: ["admin", "member"] }).default("member").notNull(),
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

// ==================== GARMIN ACCOUNTS ====================
export const garminAccounts = sqliteTable("garmin_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  garminEmail: text("garmin_email").notNull(),
  encryptedPassword: text("encrypted_password").notNull(), // AES-256
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== ACTIVITIES (운동 기록) ====================
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  garminActivityId: text("garmin_activity_id").unique(),
  activityType: text("activity_type", { enum: ["running", "trail_running", "walking"] }).notNull(),
  title: text("title"),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  duration: integer("duration").notNull(), // 초
  distance: real("distance").notNull(), // km
  pace: real("pace"), // 초/km
  heartRate: integer("heart_rate"), // 평균 bpm
  calories: integer("calories"),
  elevation: real("elevation"), // 누적 상승 고도 (m)
  elevationLoss: real("elevation_loss"), // 하강 고도 (m)
  laps: text("laps"), // JSON: [{lapNum, distance, duration, pace}]
  pointsEarned: integer("points_earned").default(0),
  visibility: text("visibility", { enum: ["public", "private"] }).default("public").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== USER POINTS ====================
export const userPoints = sqliteTable("user_points", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  currentPoints: integer("current_points").default(0).notNull(),
  totalEarned: integer("total_earned").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
});

// ==================== POINT TRANSACTIONS ====================
export const pointTransactions = sqliteTable("point_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // 양수: 적립, 음수: 사용
  type: text("type", { enum: ["earn", "spend"] }).notNull(),
  referenceId: text("reference_id"), // 활동 ID 또는 아이템 ID
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== POINT SETTINGS (관리자 설정) ====================
export const pointSettings = sqliteTable("point_settings", {
  id: text("id").primaryKey(),
  pointsPerKm: integer("points_per_km").default(10).notNull(),
  bonus10km: integer("bonus_10km").default(50).notNull(),
  bonusHalfMarathon: integer("bonus_half_marathon").default(200).notNull(),
  bonusFullMarathon: integer("bonus_full_marathon").default(500).notNull(),
  multiplierRunning: real("multiplier_running").default(1.0).notNull(),
  multiplierTrail: real("multiplier_trail").default(1.5).notNull(),
  multiplierWalking: real("multiplier_walking").default(0.5).notNull(),
  pointsPer100mElevation: integer("points_per_100m_elevation").default(10).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  updatedBy: text("updated_by").references(() => users.id),
});

// ==================== SHOP ITEMS ====================
export const shopItems = sqliteTable("shop_items", {
  id: text("id").primaryKey(),
  category: text("category", {
    enum: ["hat", "top", "bottom", "shoes", "char_effect", "text_effect"],
  }).notNull(),
  gender: text("gender", { enum: ["unisex", "male", "female"] }).default("unisex").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  rarity: text("rarity", { enum: ["common", "rare", "epic"] }).default("common").notNull(),
  previewImage: text("preview_image"),
  assetFileName: text("asset_file_name"), // 캐릭터 아이템용 스프라이트
  effectType: text("effect_type"), // text_effect: sparkle, rainbow, flame, glow, neon, gradient
  effectColors: text("effect_colors"), // JSON: ["#ff0", "#f00"] 등
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== USER INVENTORY ====================
export const userInventory = sqliteTable("user_inventory", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id")
    .notNull()
    .references(() => shopItems.id, { onDelete: "cascade" }),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }).notNull(),
});

// ==================== USER CHARACTERS (장착 상태) ====================
export const userCharacters = sqliteTable("user_characters", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  base: text("base", { enum: ["unknown", "male", "female"] }).default("unknown").notNull(),
  skinTone: text("skin_tone").default("#FFDBB4"),
  equippedHat: text("equipped_hat").references(() => shopItems.id),
  equippedTop: text("equipped_top").references(() => shopItems.id),
  equippedBottom: text("equipped_bottom").references(() => shopItems.id),
  equippedShoes: text("equipped_shoes").references(() => shopItems.id),
  equippedCharEffect: text("equipped_char_effect").references(() => shopItems.id),
  // 텍스트 효과
  nicknameEffectType: text("nickname_effect_type"), // sparkle, rainbow, flame, glow, neon, gradient
  nicknameEffectColors: text("nickname_effect_colors"), // JSON
});

// ==================== RANKINGS (캐시) ====================
export const rankings = sqliteTable("rankings", {
  id: text("id").primaryKey(),
  period: text("period", { enum: ["monthly", "yearly"] }).notNull(),
  periodKey: text("period_key").notNull(), // "2026-03" 또는 "2026"
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  totalDistance: real("total_distance").default(0).notNull(),
  distanceRank: integer("distance_rank"),
  totalElevation: real("total_elevation").default(0).notNull(),
  elevationRank: integer("elevation_rank"),
  totalTime: integer("total_time").default(0).notNull(), // 초
  activityCount: integer("activity_count").default(0).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== FEEDS ====================
export const feeds = sqliteTable("feeds", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  activityId: text("activity_id").references(() => activities.id), // 운동 기록 연동
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== FEED MEDIA ====================
export const feedMedia = sqliteTable("feed_media", {
  id: text("id").primaryKey(),
  feedId: text("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
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
  parentId: text("parent_id"),
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
  notifyBefore: integer("notify_before"),
  isShared: integer("is_shared", { mode: "boolean" }).default(false),
  color: text("color").default("primary"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== EVENT PARTICIPANTS ====================
export const eventParticipants = sqliteTable("event_participants", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => calendarEvents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["joined", "declined"] }).default("joined").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== NOTIFICATIONS ====================
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["feed", "calendar", "activity", "shop", "system"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: text("data"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  garminAccount: one(garminAccounts, { fields: [users.id], references: [garminAccounts.userId] }),
  activities: many(activities),
  points: one(userPoints, { fields: [users.id], references: [userPoints.userId] }),
  character: one(userCharacters, { fields: [users.id], references: [userCharacters.userId] }),
  inventory: many(userInventory),
  feeds: many(feeds),
  feedLikes: many(feedLikes),
  feedComments: many(feedComments),
  calendarEvents: many(calendarEvents),
  notifications: many(notifications),
}));

export const garminAccountsRelations = relations(garminAccounts, ({ one }) => ({
  user: one(users, { fields: [garminAccounts.userId], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, { fields: [userPoints.userId], references: [users.id] }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, { fields: [pointTransactions.userId], references: [users.id] }),
}));

export const shopItemsRelations = relations(shopItems, ({ many }) => ({
  inventory: many(userInventory),
}));

export const userInventoryRelations = relations(userInventory, ({ one }) => ({
  user: one(users, { fields: [userInventory.userId], references: [users.id] }),
  item: one(shopItems, { fields: [userInventory.itemId], references: [shopItems.id] }),
}));

export const userCharactersRelations = relations(userCharacters, ({ one }) => ({
  user: one(users, { fields: [userCharacters.userId], references: [users.id] }),
}));

export const rankingsRelations = relations(rankings, ({ one }) => ({
  user: one(users, { fields: [rankings.userId], references: [users.id] }),
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  user: one(users, { fields: [feeds.userId], references: [users.id] }),
  activity: one(activities, { fields: [feeds.activityId], references: [activities.id] }),
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

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  user: one(users, { fields: [calendarEvents.userId], references: [users.id] }),
  participants: many(eventParticipants),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(calendarEvents, { fields: [eventParticipants.eventId], references: [calendarEvents.id] }),
  user: one(users, { fields: [eventParticipants.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
