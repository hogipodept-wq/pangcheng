CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'asset' NOT NULL,
	`parent_id` integer,
	`note` text,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`name` text NOT NULL,
	`file_url` text NOT NULL,
	`file_size` integer DEFAULT 0 NOT NULL,
	`mime_type` text,
	`uploaded_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budget_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`threshold` real DEFAULT 0.8 NOT NULL,
	`current_ratio` real DEFAULT 0 NOT NULL,
	`message` text,
	`resolved` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'general' NOT NULL,
	`project_id` integer,
	`start_date` text NOT NULL,
	`end_date` text,
	`all_day` integer DEFAULT true NOT NULL,
	`location` text,
	`description` text,
	`created_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `client_contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`phone` text,
	`email` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tax_id` text,
	`type` text DEFAULT 'company' NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT '磐承營造工程' NOT NULL,
	`tax_id` text,
	`address` text,
	`phone` text,
	`email` text,
	`logo_url` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `construction_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`date` text NOT NULL,
	`weather` text DEFAULT 'sunny' NOT NULL,
	`temperature` text,
	`workforce` integer DEFAULT 0 NOT NULL,
	`summary` text,
	`content` text,
	`recorded_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `document_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inspection_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`construction_log_id` integer,
	`category` text DEFAULT 'during' NOT NULL,
	`title` text,
	`photo_url` text NOT NULL,
	`taken_at` text,
	`location` text,
	`description` text,
	`uploaded_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`type` text DEFAULT 'info' NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`link` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `petty_cash_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'expense' NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`summary` text,
	`project_id` integer,
	`voucher_id` integer,
	`handled_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `procurement_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`procurement_id` integer NOT NULL,
	`name` text NOT NULL,
	`spec` text,
	`unit` text,
	`quantity` real DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `procurement_quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`procurement_id` integer NOT NULL,
	`supplier_id` integer,
	`supplier_name` text NOT NULL,
	`quote_amount` real DEFAULT 0 NOT NULL,
	`quote_date` text,
	`selected` integer DEFAULT false NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `procurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`project_id` integer,
	`supplier_id` integer,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`payment_method` text DEFAULT 'bank_transfer' NOT NULL,
	`requested_by` text,
	`request_date` text,
	`expected_date` text,
	`received_date` text,
	`total_amount` real DEFAULT 0 NOT NULL,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_bid_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`item_no` text,
	`name` text NOT NULL,
	`spec` text,
	`unit` text,
	`quantity` real DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `project_personnel` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`role` text DEFAULT 'engineer' NOT NULL,
	`phone` text,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`start_date` text,
	`end_date` text,
	`progress` integer DEFAULT 0 NOT NULL,
	`assignee` text,
	`note` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`client_id` integer,
	`status` text DEFAULT 'planning' NOT NULL,
	`address` text,
	`manager` text,
	`start_date` text,
	`end_date` text,
	`contract_amount` real DEFAULT 0 NOT NULL,
	`budget_amount` real DEFAULT 0 NOT NULL,
	`description` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotation_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_id` integer NOT NULL,
	`item_no` text,
	`name` text NOT NULL,
	`spec` text,
	`unit` text,
	`quantity` real DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `quotation_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`items_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`client_id` integer,
	`project_name` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`quote_date` text,
	`valid_until` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`note` text,
	`created_by` text,
	`signed_file_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`phone` text,
	`email` text,
	`id_number` text,
	`hire_date` text,
	`daily_wage` real DEFAULT 0 NOT NULL,
	`note` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_petty_cash` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_id` integer NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_petty_cash_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_petty_cash_id` integer NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'expense' NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`summary` text
);
--> statement-breakpoint
CREATE TABLE `supplier_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`file_type` text DEFAULT 'other' NOT NULL,
	`name` text NOT NULL,
	`file_url` text NOT NULL,
	`expiry_date` text,
	`uploaded_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tax_id` text,
	`trade_category` text DEFAULT 'other' NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`address` text,
	`rating` integer DEFAULT 0 NOT NULL,
	`note` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`role` text DEFAULT 'user' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `voucher_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`voucher_id` integer NOT NULL,
	`account_id` integer,
	`account_code` text,
	`account_name` text,
	`debit` real DEFAULT 0 NOT NULL,
	`credit` real DEFAULT 0 NOT NULL,
	`summary` text
);
--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`type` text DEFAULT 'general' NOT NULL,
	`date` text NOT NULL,
	`summary` text,
	`total_amount` real DEFAULT 0 NOT NULL,
	`project_id` integer,
	`created_by` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`source_id` integer,
	`created_at` text NOT NULL
);
