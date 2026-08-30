CREATE TYPE "public"."delivery_adapter_type" AS ENUM('SANDBOX', 'WEBHOOK');--> statement-breakpoint
CREATE TYPE "public"."delivery_attempt_status" AS ENUM('SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."repair_status" AS ENUM('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."repair_type" AS ENUM('plumbing', 'heating', 'electrical', 'roof_or_ceiling', 'windows_or_doors', 'damp_or_mould', 'structural', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('RESIDENT', 'STAFF');--> statement-breakpoint
CREATE TABLE "abuse_buckets" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"council_id" uuid NOT NULL,
	"resident_id" text NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"council_id" uuid NOT NULL,
	"actor_user_id" text,
	"case_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "councils" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"adapter_type" "delivery_adapter_type" NOT NULL,
	"status" "delivery_attempt_status" NOT NULL,
	"safe_response_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempt_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"council_id" uuid NOT NULL,
	"resident_id" text NOT NULL,
	"reference" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"address" text NOT NULL,
	"repair_type" "repair_type" NOT NULL,
	"issue_description" text NOT NULL,
	"when_problem_started" date NOT NULL,
	"is_getting_worse" boolean NOT NULL,
	"immediate_danger" boolean NOT NULL,
	"access_notes" text,
	"additional_notes" text,
	"status" "repair_status" DEFAULT 'NEW' NOT NULL,
	"delivery_status" "delivery_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"council_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'RESIDENT' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_case_id_repair_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."repair_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_council_id_councils_id_fk" FOREIGN KEY ("council_id") REFERENCES "public"."councils"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_resident_id_user_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_council_id_councils_id_fk" FOREIGN KEY ("council_id") REFERENCES "public"."councils"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_case_id_repair_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."repair_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_case_id_repair_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."repair_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_cases" ADD CONSTRAINT "repair_cases_council_id_councils_id_fk" FOREIGN KEY ("council_id") REFERENCES "public"."councils"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_cases" ADD CONSTRAINT "repair_cases_resident_id_user_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_council_id_councils_id_fk" FOREIGN KEY ("council_id") REFERENCES "public"."councils"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "abuse_buckets_expiry_idx" ON "abuse_buckets" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attachments_object_key_unique" ON "attachments" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "attachments_case_idx" ON "attachments" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "attachments_tenant_owner_idx" ON "attachments" USING btree ("council_id","resident_id");--> statement-breakpoint
CREATE INDEX "audit_events_council_created_idx" ON "audit_events" USING btree ("council_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_case_idx" ON "audit_events" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "councils_slug_unique" ON "councils" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "delivery_attempts_case_idx" ON "delivery_attempts" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_key_unique" ON "rate_limit" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "repair_cases_reference_unique" ON "repair_cases" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "repair_cases_resident_idempotency_unique" ON "repair_cases" USING btree ("resident_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "repair_cases_council_status_idx" ON "repair_cases" USING btree ("council_id","status","created_at");--> statement-breakpoint
CREATE INDEX "repair_cases_resident_created_idx" ON "repair_cases" USING btree ("council_id","resident_id","created_at");--> statement-breakpoint
CREATE INDEX "repair_cases_delivery_idx" ON "repair_cases" USING btree ("council_id","delivery_status");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expiry_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_council_role_idx" ON "user" USING btree ("council_id","role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");