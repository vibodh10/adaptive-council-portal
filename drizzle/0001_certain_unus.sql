DROP INDEX "account_provider_account_unique";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "issuer" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_account_unique" ON "account" USING btree ("issuer","account_id");