ALTER TABLE `quotation_items` ADD `category` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `description` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `start_date` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `end_date` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `duration` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `location` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `client_name` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `client_contact` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `client_phone` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `client_email` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `client_address` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `discount_percent` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `quotations` ADD `discount_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `quotations` ADD `tax_rate` real DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `quotations` ADD `payment_terms` text;--> statement-breakpoint
ALTER TABLE `quotations` ADD `terms` text;