import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/db/drizzle";
import { repositories, analysisJobs, subsystems } from "@/db/schema";

import { GitHubService } from "@/lib/github";
import { AIAnalyzer } from "@/lib/analyzer";
import { WikiGenerator } from "@/lib/wiki-generator";
import { wikiPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const app = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        url: z
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
          ),
      })
    ),
    async (c) => {
      const { url } = c.req.valid("json");

      try {
        const { owner, repo } = GitHubService.parseRepoUrl(url);

        const existingRepo = await db
          .select()
          .from(repositories)
          .where(eq(repositories.url, url))
          .limit(1);

        let repositoryId: string;

        if (existingRepo.length > 0) {
          repositoryId = existingRepo[0].id;
        } else {
          const metadata = await GitHubService.getRepositoryMetadata(url);

          repositoryId = nanoid();
          await db.insert(repositories).values({
            id: repositoryId,
            url: metadata.url,
            owner: metadata.owner,
            name: metadata.name,
            description: metadata.description,
            language: metadata.language,
            stars: metadata.stars.toString(),
            analyzedAt: null,
          });
        }

        const jobId = nanoid();
        await db.insert(analysisJobs).values({
          id: jobId,
          repositoryId,
          status: "pending",
          progress: "0%",
        });

        analyzeRepositoryInBackground(jobId, repositoryId, owner, repo);

        return c.json(
          {
            jobId,
            repositoryId,
            status: "pending",
            message: "Repository analysis started",
          },
          200
        );
      } catch (error) {
        console.error("Analysis error:", error);
        return c.json(
          {
            error: "Failed to start analysis",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          500
        );
      }
    }
  )

  .get(
    "/:jobId",
    zValidator(
      "param",
      z.object({ jobId: z.string().min(1, "Job ID is required") })
    ),
    async (c) => {
      const { jobId } = c.req.valid("param");

      try {
        const [job] = await db
          .select()
          .from(analysisJobs)
          .where(eq(analysisJobs.id, jobId))
          .limit(1);

        if (!job) {
          return c.json({ error: "Analysis job not found" }, 404);
        }

        return c.json(
          {
            jobId,
            status: job.status,
            progress: job.progress,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            result: job.result,
            error: job.errorMessage,
            repositoryId: job.repositoryId,
          },
          200
        );
      } catch (error) {
        console.error("Error fetching analysis status:", error);
        return c.json({ error: "Failed to fetch analysis status" }, 500);
      }
    }
  );

async function analyzeRepositoryInBackground(
  jobId: string,
  repositoryId: string,
  owner: string,
  repo: string
) {
  try {
    await db
      .update(analysisJobs)
      .set({
        status: "in_progress",
        progress: "10%",
      })
      .where(eq(analysisJobs.id, jobId));

    const files = await GitHubService.getAllFiles(owner, repo);

    await db
      .update(analysisJobs)
      .set({ progress: "30%" })
      .where(eq(analysisJobs.id, jobId));

    const analysis = await AIAnalyzer.analyzeRepository(owner, repo, files);

    await db
      .update(analysisJobs)
      .set({ progress: "70%" })
      .where(eq(analysisJobs.id, jobId));

    for (const subsystem of analysis.subsystems) {
      const subsystemId = nanoid();
      await db.insert(subsystems).values({
        id: subsystemId,
        repositoryId,
        ...subsystem,
      });
    }

    await db
      .update(repositories)
      .set({ analyzedAt: new Date() })
      .where(eq(repositories.id, repositoryId));

    await db
      .update(analysisJobs)
      .set({
        status: "completed",
        progress: "100%",
        completedAt: new Date(),
        result: {
          summary: analysis.summary,
          subsystemCount: analysis.subsystems.length,
        },
      })
      .where(eq(analysisJobs.id, jobId));

    // Automatically start wiki generation after analysis completes
    await generateWikiForRepository(repositoryId, owner, repo);
  } catch (error) {
    console.error("Background analysis error:", error);

    await db
      .update(analysisJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(analysisJobs.id, jobId));
  }
}

async function generateWikiForRepository(
  repositoryId: string,
  owner: string,
  repo: string
) {
  try {
    // Get the repository and its subsystems
    const [repository] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, repositoryId))
      .limit(1);

    if (!repository) {
      console.error("Repository not found for wiki generation");
      return;
    }

    const repoSubsystems = await db
      .select()
      .from(subsystems)
      .where(eq(subsystems.repositoryId, repositoryId));

    if (repoSubsystems.length === 0) {
      console.error("No subsystems found for wiki generation");
      return;
    }

    // Check if wiki already exists
    const existingPages = await db
      .select()
      .from(wikiPages)
      .where(eq(wikiPages.subsystemId, repoSubsystems[0].id))
      .limit(1);

    if (existingPages.length > 0) {
      console.log("Wiki already exists, skipping generation");
      return;
    }

    // Generate wiki pages for each subsystem
    let successCount = 0;
    for (const subsystem of repoSubsystems) {
      try {
        console.log(`Processing subsystem: ${subsystem.name}`);

        const wikiContent = await WikiGenerator.generateWikiPage(
          {
            ...subsystem,
            description: subsystem.description || "No description available",
            complexity: subsystem.complexity || "medium",
            files: subsystem.files || [],
            entryPoints: subsystem.entryPoints || [],
            dependencies: subsystem.dependencies || [],
          },
          owner,
          repo
        );

        const pageId = nanoid();
        await db.insert(wikiPages).values({
          id: pageId,
          subsystemId: subsystem.id,
          title: wikiContent.title,
          content: wikiContent.content,
          citations: wikiContent.citations,
          tableOfContents: wikiContent.tableOfContents,
        });

        console.log(`✓ Generated wiki page for subsystem: ${subsystem.name}`);
        successCount++;
      } catch (error) {
        console.error(
          `✗ Failed to generate wiki for subsystem ${subsystem.name}:`,
          error instanceof Error ? error.message : error
        );
        // Continue with other subsystems even if one fails
      }
    }

    console.log(
      `Wiki generation completed for repository: ${repository.name} (${successCount}/${repoSubsystems.length} subsystems successful)`
    );
  } catch (error) {
    console.error("Wiki generation error:", error);
  }
}

export default app;
