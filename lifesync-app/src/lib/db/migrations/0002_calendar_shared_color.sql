-- 캘린더 일정에 공유 여부 컬럼 추가
ALTER TABLE `calendar_events` ADD COLUMN `is_shared` integer DEFAULT false;
--> statement-breakpoint
-- 캘린더 일정에 색상 컬럼 추가
ALTER TABLE `calendar_events` ADD COLUMN `color` text DEFAULT 'primary';
