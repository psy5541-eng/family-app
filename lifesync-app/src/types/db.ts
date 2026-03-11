import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  sessions,
  feeds,
  feedMedia,
  feedLikes,
  feedComments,
  calendarEvents,
  eventParticipants,
  notifications,
} from "@/lib/db/schema";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Feed = InferSelectModel<typeof feeds>;
export type NewFeed = InferInsertModel<typeof feeds>;

export type FeedMedia = InferSelectModel<typeof feedMedia>;
export type NewFeedMedia = InferInsertModel<typeof feedMedia>;

export type FeedLike = InferSelectModel<typeof feedLikes>;
export type NewFeedLike = InferInsertModel<typeof feedLikes>;

export type FeedComment = InferSelectModel<typeof feedComments>;
export type NewFeedComment = InferInsertModel<typeof feedComments>;

export type CalendarEvent = InferSelectModel<typeof calendarEvents>;
export type NewCalendarEvent = InferInsertModel<typeof calendarEvents>;

export type EventParticipant = InferSelectModel<typeof eventParticipants>;
export type NewEventParticipant = InferInsertModel<typeof eventParticipants>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

// API 공통 응답 타입
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// 피드 with 관계
export type FeedWithRelations = Feed & {
  user: Pick<User, "id" | "nickname" | "profileImage">;
  media: FeedMedia[];
  likes: FeedLike[];
  comments: FeedComment[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
};
