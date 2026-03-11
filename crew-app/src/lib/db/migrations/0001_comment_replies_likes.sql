-- 댓글에 대댓글 지원을 위한 parent_id 컬럼 추가
ALTER TABLE `feed_comments` ADD COLUMN `parent_id` text;
--> statement-breakpoint
-- 댓글 좋아요 테이블 생성
CREATE TABLE `comment_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `feed_comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
