CREATE TYPE "public"."vehicle_status" AS ENUM('AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."driver_status" AS ENUM('AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('ACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_number" text NOT NULL,
	"name" text NOT NULL,
	"model" text,
	"type" text NOT NULL,
	"max_load_capacity" numeric NOT NULL,
	"odometer" integer DEFAULT 0 NOT NULL,
	"acquisition_cost" numeric NOT NULL,
	"status" "vehicle_status" DEFAULT 'AVAILABLE' NOT NULL,
	"region" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"license_number" text NOT NULL,
	"license_category" text NOT NULL,
	"license_expiry_date" date NOT NULL,
	"contact_number" text NOT NULL,
	"safety_score" integer DEFAULT 100 NOT NULL,
	"status" "driver_status" DEFAULT 'AVAILABLE' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"service_type" text NOT NULL,
	"description" text,
	"cost" numeric NOT NULL,
	"status" "maintenance_status" DEFAULT 'ACTIVE' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;