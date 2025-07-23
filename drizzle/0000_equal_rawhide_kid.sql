CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subsystem_type" AS ENUM('feature', 'service', 'utility', 'infrastructure', 'cli', 'api', 'frontend', 'backend');--> statement-breakpoint
CREATE TABLE "analysis_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"repository_id" text,
	"status" "analysis_status" DEFAULT 'pending' NOT NULL,
	"progress" varchar(50) DEFAULT '0%',
	"result" json,
	"error_message" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" text PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"owner" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"language" varchar(50),
	"stars" varchar(20),
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "repositories_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "subsystems" (
	"id" text PRIMARY KEY NOT NULL,
	"repository_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"type" "subsystem_type" NOT NULL,
	"files" json DEFAULT '[]'::json,
	"entry_points" json DEFAULT '[]'::json,
	"dependencies" json DEFAULT '[]'::json,
	"complexity" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"subsystem_id" text NOT NULL,
	"title" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"citations" json DEFAULT '[]'::json,
	"table_of_contents" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subsystems" ADD CONSTRAINT "subsystems_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_subsystem_id_subsystems_id_fk" FOREIGN KEY ("subsystem_id") REFERENCES "public"."subsystems"("id") ON DELETE no action ON UPDATE no action;