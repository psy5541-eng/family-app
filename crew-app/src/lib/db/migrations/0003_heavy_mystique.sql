CREATE TABLE `activities` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_garmin_activity_id_unique` ON `activities` (`garmin_activity_id`);--> statement-breakpoint
CREATE TABLE `comment_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `feed_comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `event_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'joined' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `garmin_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`garmin_email` text NOT NULL,
	`encrypted_password` text NOT NULL,
	`last_sync_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `point_settings` (
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
--> statement-breakpoint
CREATE TABLE `point_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`reference_id` text,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rankings` (
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
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
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
--> statement-breakpoint
CREATE TABLE `user_characters` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `user_characters_user_id_unique` ON `user_characters` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`purchased_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_points` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`current_points` integer DEFAULT 0 NOT NULL,
	`total_earned` integer DEFAULT 0 NOT NULL,
	`total_spent` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_points_user_id_unique` ON `user_points` (`user_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
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
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password", "nickname", "profile_image", "role", "biometric_enabled", "fcm_token", "created_at", "updated_at") SELECT "id", "email", "password", "nickname", "profile_image", "role", "biometric_enabled", "fcm_token", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `is_shared` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `color` text DEFAULT 'primary';--> statement-breakpoint
ALTER TABLE `feed_comments` ADD `parent_id` text;--> statement-breakpoint
ALTER TABLE `feeds` ADD `activity_id` text REFERENCES activities(id);