ALTER TABLE "sessions" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "userId";