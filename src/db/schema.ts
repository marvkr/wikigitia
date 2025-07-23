import {
  pgTable,
  text,
  varchar,
  timestamp,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

export const subsystemTypeEnum = pgEnum("subsystem_type", [
  "feature",
  "service",
  "utility",
  "infrastructure",
  "cli",
  "api",
  "frontend",
  "backend",
]);

export const repositories = pgTable("repositories", {
  id: text("id").primaryKey(),
  url: varchar("url", { length: 500 }).notNull().unique(),
  owner: varchar("owner", { length: 100 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  language: varchar("language", { length: 50 }),
  stars: varchar("stars", { length: 20 }),
  analyzedAt: timestamp("analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analysisJobs = pgTable("analysis_jobs", {
  id: text("id").primaryKey(),
  repositoryId: text("repository_id").references(() => repositories.id),
  status: analysisStatusEnum("status").default("pending").notNull(),
  progress: varchar("progress", { length: 50 }).default("0%"),
  result: json("result"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subsystems = pgTable("subsystems", {
  id: text("id").primaryKey(),
  repositoryId: text("repository_id")
    .references(() => repositories.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: subsystemTypeEnum("type").notNull(),
  files: json("files").$type<string[]>().default([]),
  entryPoints: json("entry_points").$type<string[]>().default([]),
  dependencies: json("dependencies").$type<string[]>().default([]),
  complexity: varchar("complexity", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wikiPages = pgTable("wiki_pages", {
  id: text("id").primaryKey(),
  subsystemId: text("subsystem_id")
    .references(() => subsystems.id)
    .notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  citations: json("citations")
    .$type<
      Array<{
        text: string;
        file: string;
        startLine: number;
        endLine: number;
        url: string;
        context: string;
      }>
    >()
    .default([]),
  tableOfContents: json("table_of_contents")
    .$type<
      Array<{
        title: string;
        anchor: string;
        level: number;
      }>
    >()
    .default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  analysisJobs: many(analysisJobs),
  subsystems: many(subsystems),
}));

export const analysisJobsRelations = relations(analysisJobs, ({ one }) => ({
  repository: one(repositories, {
    fields: [analysisJobs.repositoryId],
    references: [repositories.id],
  }),
}));

export const subsystemsRelations = relations(subsystems, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [subsystems.repositoryId],
    references: [repositories.id],
  }),
  wikiPages: many(wikiPages),
}));

export const wikiPagesRelations = relations(wikiPages, ({ one }) => ({
  subsystem: one(subsystems, {
    fields: [wikiPages.subsystemId],
    references: [subsystems.id],
  }),
}));

export const insertRepositorySchema = createInsertSchema(repositories);
export const selectRepositorySchema = createSelectSchema(repositories);
export const insertAnalysisJobSchema = createInsertSchema(analysisJobs);
export const selectAnalysisJobSchema = createSelectSchema(analysisJobs);
export const insertSubsystemSchema = createInsertSchema(subsystems);
export const selectSubsystemSchema = createSelectSchema(subsystems);
export const insertWikiPageSchema = createInsertSchema(wikiPages);
export const selectWikiPageSchema = createSelectSchema(wikiPages);

export const githubUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      const githubRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
      return githubRegex.test(url);
    },
    {
      message: "Must be a valid GitHub repository URL",
    }
  );

export const analyzeRepositorySchema = z.object({
  url: githubUrlSchema,
});

export type InsertRepository = typeof repositories.$inferInsert;
export type SelectRepository = typeof repositories.$inferSelect;
export type InsertAnalysisJob = typeof analysisJobs.$inferInsert;
export type SelectAnalysisJob = typeof analysisJobs.$inferSelect;
export type InsertSubsystem = typeof subsystems.$inferInsert;
export type SelectSubsystem = typeof subsystems.$inferSelect;
export type InsertWikiPage = typeof wikiPages.$inferInsert;
export type SelectWikiPage = typeof wikiPages.$inferSelect;

export type Citation = {
  text: string;
  file: string;
  startLine: number;
  endLine: number;
  url: string;
  context: string;
};

export type TableOfContentsItem = {
  title: string;
  anchor: string;
  level: number;
};
