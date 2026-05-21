ALTER TABLE `construction_logs` ADD `items_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `construction_logs` ADD `labor_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `construction_logs` ADD `equipment_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `construction_logs` ADD `materials_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `construction_logs` ADD `inspections_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `construction_logs` ADD `coordination_notes` text;--> statement-breakpoint
ALTER TABLE `construction_logs` ADD `safety_notes` text;--> statement-breakpoint
ALTER TABLE `construction_logs` ADD `status` text DEFAULT 'submitted' NOT NULL;