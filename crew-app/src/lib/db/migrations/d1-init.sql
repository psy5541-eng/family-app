-- crew-app D1 초기 스키마
CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`nickname` text NOT NULL,
	`profile_image` text,
	`role` text DEFAULT 'member' NOT NULL,
	`biometric_enabled` integer DEFAULT false,
	`fcm_token` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);

CREATE TABLE IF NOT EXISTS `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS `sessions_token_unique` ON `sessions` (`token`);

CREATE TABLE IF NOT EXISTS `garmin_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`garmin_email` text NOT NULL,
	`encrypted_password` text NOT NULL,
	`last_sync_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`garmin_activity_id` text,
	`activity_type` text NOT NULL,
	`title` text,
	`start_time` integer NOT NULL,
	`duration` integer NOT NULL,
	`distance` real NOT NULL,
	`pace` real,
	`heart_rate` integer,
	`calories` integer,
	`elevation` real,
	`elevation_loss` real,
	`points_earned` integer DEFAULT 0,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS `activities_garmin_activity_id_unique` ON `activities` (`garmin_activity_id`);

CREATE TABLE IF NOT EXISTS `user_points` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`current_points` integer DEFAULT 0 NOT NULL,
	`total_earned` integer DEFAULT 0 NOT NULL,
	`total_spent` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS `user_points_user_id_unique` ON `user_points` (`user_id`);

CREATE TABLE IF NOT EXISTS `point_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`reference_id` text,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `point_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`points_per_km` integer DEFAULT 10 NOT NULL,
	`bonus_10km` integer DEFAULT 50 NOT NULL,
	`bonus_half_marathon` integer DEFAULT 200 NOT NULL,
	`bonus_full_marathon` integer DEFAULT 500 NOT NULL,
	`multiplier_running` real DEFAULT 1 NOT NULL,
	`multiplier_trail` real DEFAULT 1.5 NOT NULL,
	`multiplier_walking` real DEFAULT 0.5 NOT NULL,
	`points_per_100m_elevation` integer DEFAULT 10 NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `shop_items` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`gender` text DEFAULT 'unisex' NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`rarity` text DEFAULT 'common' NOT NULL,
	`preview_image` text,
	`asset_file_name` text,
	`effect_type` text,
	`effect_colors` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `user_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`purchased_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `user_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`base` text DEFAULT 'male' NOT NULL,
	`skin_tone` text DEFAULT '#FFDBB4',
	`equipped_hat` text,
	`equipped_top` text,
	`equipped_bottom` text,
	`equipped_shoes` text,
	`equipped_char_effect` text,
	`nickname_effect_type` text,
	`nickname_effect_colors` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`equipped_hat`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipped_top`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipped_bottom`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipped_shoes`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipped_char_effect`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX IF NOT EXISTS `user_characters_user_id_unique` ON `user_characters` (`user_id`);

CREATE TABLE IF NOT EXISTS `rankings` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`period_key` text NOT NULL,
	`user_id` text NOT NULL,
	`total_distance` real DEFAULT 0 NOT NULL,
	`distance_rank` integer,
	`total_elevation` real DEFAULT 0 NOT NULL,
	`elevation_rank` integer,
	`total_time` integer DEFAULT 0 NOT NULL,
	`activity_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text,
	`activity_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `feed_media` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`media_url` text NOT NULL,
	`media_type` text NOT NULL,
	`order` integer DEFAULT 0,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `feed_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `feed_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `comment_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `feed_comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`is_all_day` integer DEFAULT false,
	`is_dday` integer DEFAULT false,
	`place_name` text,
	`place_address` text,
	`latitude` text,
	`longitude` text,
	`naver_place_id` text,
	`notify_before` integer,
	`is_shared` integer DEFAULT false,
	`color` text DEFAULT 'primary',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `event_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'joined' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`data` text,
	`is_read` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
