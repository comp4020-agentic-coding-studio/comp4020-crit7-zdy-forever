CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`court_id` integer NOT NULL,
	`booking_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_free_student_hour` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_court_date_start_unique` ON `bookings` (`court_id`,`booking_date`,`start_time`);--> statement-breakpoint
CREATE TABLE `courts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hall` text NOT NULL,
	`court_number` integer NOT NULL,
	`name` text NOT NULL,
	`display_row` integer NOT NULL,
	`display_column` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courts_hall_court_number_unique` ON `courts` (`hall`,`court_number`);