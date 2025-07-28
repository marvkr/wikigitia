import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/db/drizzle";
import { repositories, analysisJobs } from "@/db/schema";
import { GitHubService } from "@/lib/github";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { inngest } from "@/lib/inngest";

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
        });

        // Send event to Inngest to start analysis
        await inngest.send({
          name: "repository/analyze",
          data: {
            jobId,
            repositoryId,
            owner,
            repo,
          },
        });

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
        const [jobWithRepo] = await db
          .select({
            jobId: analysisJobs.id,
            status: analysisJobs.status,
            startedAt: analysisJobs.startedAt,
            completedAt: analysisJobs.completedAt,
            result: analysisJobs.result,
            error: analysisJobs.errorMessage,
            repositoryId: analysisJobs.repositoryId,
            repositoryName: repositories.name,
          })
          .from(analysisJobs)
          .leftJoin(repositories, eq(analysisJobs.repositoryId, repositories.id))
          .where(eq(analysisJobs.id, jobId))
          .limit(1);

        if (!jobWithRepo) {
          return c.json({ error: "Analysis job not found" }, 404);
        }

        return c.json(
          {
            jobId,
            status: jobWithRepo.status,
            startedAt: jobWithRepo.startedAt,
            completedAt: jobWithRepo.completedAt,
            result: jobWithRepo.result,
            error: jobWithRepo.error,
            repositoryId: jobWithRepo.repositoryId,
            repositoryName: jobWithRepo.repositoryName,
          },
          200
        );
      } catch (error) {
        console.error("Error fetching analysis status:", error);
        return c.json({ error: "Failed to fetch analysis status" }, 500);
      }
    }
  );

export default app;
