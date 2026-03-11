import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  sessions,
  garminAccounts,
  activities,
  userPoints,
  pointTransactions,
  pointSettings,
  shopItems,
  userInventory,
  userCharacters,
  rankings,
  feeds,
  feedMedia,
  feedLikes,
  feedComments,
  commentLikes,
  calendarEvents,
  eventParticipants,
  notifications,
} from "@/lib/db/schema";

// ==================== USERS ====================
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

// ==================== GARMIN ====================
export type GarminAccount = InferSelectModel<typeof garminAccounts>;
export type NewGarminAccount = InferInsertModel<typeof garminAccounts>;

// ==================== ACTIVITIES ====================
export type Activity = InferSelectModel<typeof activities>;
export type NewActivity = InferInsertModel<typeof activities>;

// ==================== POINTS ====================
export type UserPoint = InferSelectModel<typeof userPoints>;
export type NewUserPoint = InferInsertModel<typeof userPoints>;

export type PointTransaction = InferSelectModel<typeof pointTransactions>;
export type NewPointTransaction = InferInsertModel<typeof pointTransactions>;

export type PointSetting = InferSelectModel<typeof pointSettings>;
export type NewPointSetting = InferInsertModel<typeof pointSettings>;

// ==================== SHOP ====================
export type ShopItem = InferSelectModel<typeof shopItems>;
export type NewShopItem = InferInsertModel<typeof shopItems>;

export type UserInventoryItem = InferSelectModel<typeof userInventory>;
export type NewUserInventoryItem = InferInsertModel<typeof userInventory>;

// ==================== CHARACTERS ====================
export type UserCharacter = InferSelectModel<typeof userCharacters>;
export type NewUserCharacter = InferInsertModel<typeof userCharacters>;

// ==================== RANKINGS ====================
export type Ranking = InferSelectModel<typeof rankings>;
export type NewRanking = InferInsertModel<typeof rankings>;

// ==================== FEEDS ====================
export type Feed = InferSelectModel<typeof feeds>;
export type NewFeed = InferInsertModel<typeof feeds>;

export type FeedMedia = InferSelectModel<typeof feedMedia>;
export type NewFeedMedia = InferInsertModel<typeof feedMedia>;

export type FeedLike = InferSelectModel<typeof feedLikes>;
export type NewFeedLike = InferInsertModel<typeof feedLikes>;

export type FeedComment = InferSelectModel<typeof feedComments>;
export type NewFeedComment = InferInsertModel<typeof feedComments>;

export type CommentLike = InferSelectModel<typeof commentLikes>;
export type NewCommentLike = InferInsertModel<typeof commentLikes>;

// ==================== CALENDAR ====================
export type CalendarEvent = InferSelectModel<typeof calendarEvents>;
export type NewCalendarEvent = InferInsertModel<typeof calendarEvents>;

export type EventParticipant = InferSelectModel<typeof eventParticipants>;
export type NewEventParticipant = InferInsertModel<typeof eventParticipants>;

// ==================== NOTIFICATIONS ====================
export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

// ==================== API ====================
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ==================== COMPOSITE TYPES ====================
export type FeedWithRelations = Feed & {
  user: Pick<User, "id" | "nickname" | "profileImage"> & {
    character?: Pick<UserCharacter, "nicknameEffectType" | "nicknameEffectColors"> | null;
  };
  media: FeedMedia[];
  likes: FeedLike[];
  comments: FeedComment[];
  activity?: Pick<Activity, "activityType" | "distance" | "duration" | "pace"> | null;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
};

export type ActivityWithUser = Activity & {
  user: Pick<User, "id" | "nickname" | "profileImage">;
};

export type RankingWithUser = Ranking & {
  user: Pick<User, "id" | "nickname" | "profileImage"> & {
    character?: Pick<UserCharacter, "nicknameEffectType" | "nicknameEffectColors"> | null;
  };
};

export type ShopItemWithOwnership = ShopItem & {
  owned: boolean;
  equipped: boolean;
};

export type UserProfile = User & {
  points?: UserPoint | null;
  character?: UserCharacter | null;
  garminConnected: boolean;
};
