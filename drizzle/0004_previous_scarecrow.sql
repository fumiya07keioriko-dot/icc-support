CREATE TABLE `task_assignees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`staffId` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_assignees_id` PRIMARY KEY(`id`)
);
