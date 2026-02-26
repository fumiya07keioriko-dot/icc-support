CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pin_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(128) NOT NULL,
	`trusted` boolean NOT NULL DEFAULT false,
	`generation` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`failCount` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	CONSTRAINT `pin_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `pin_sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_staffId_unique` UNIQUE(`staffId`)
);
--> statement-breakpoint
CREATE TABLE `staff_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` varchar(32) NOT NULL,
	`venueId` int,
	`areaId` int,
	`workContent` varchar(255) NOT NULL DEFAULT '',
	`status` enum('active','moving','break','available') NOT NULL DEFAULT 'active',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_status_staffId_unique` UNIQUE(`staffId`)
);
--> statement-breakpoint
CREATE TABLE `system_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`state` enum('todo','in_progress','done') NOT NULL DEFAULT 'todo',
	`assigneeId` varchar(32),
	`venueId` int,
	`areaId` int,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tetris_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`dayLabel` varchar(32),
	`timeSlot` varchar(32) NOT NULL,
	`staffId` varchar(32) NOT NULL,
	`content` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `tetris_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`floor` varchar(16),
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `venues_id` PRIMARY KEY(`id`)
);
