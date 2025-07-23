import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/db/drizzle";
import { repositories, subsystems, wikiPages } from "@/db/schema";
import { WikiGenerator } from "@/lib/wiki-generator";
import { GitHubService } from "@/lib/github";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const app = new Hono()
  .post(
    "/generate/:repositoryId",
    zValidator("param", z.object({ repositoryId: z.string() })),
    async (c) => {
      const { repositoryId } = c.req.valid("param");

      try {
        const [repository] = await db
          .select()
          .from(repositories)
          .where(eq(repositories.id, repositoryId))
          .limit(1);

        if (!repository) {
          return c.json({ error: "Repository not found" }, 404);
        }

        const repoSubsystems = await db
          .select()
          .from(subsystems)
          .where(eq(subsystems.repositoryId, repositoryId));

        if (repoSubsystems.length === 0) {
          return c.json(
            {
              error:
                "No subsystems found. Please analyze the repository first.",
            },
            404
          );
        }

        const existingPages = await db
          .select()
          .from(wikiPages)
          .where(eq(wikiPages.subsystemId, repoSubsystems[0].id))
          .limit(1);

        if (existingPages.length > 0) {
          return c.json(
            { message: "Wiki already generated", repositoryId },
            200
          );
        }

        generateWikiInBackground(repositoryId, repository, repoSubsystems);

        return c.json(
          {
            message: "Wiki generation started",
            repositoryId,
            subsystemCount: repoSubsystems.length,
          },
          200
        );
      } catch (error) {
        console.error("Wiki generation error:", error);
        return c.json(
          {
            error: "Failed to start wiki generation",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          500
        );
      }
    }
  )

  .get(
    "/:repositoryId",
    zValidator("param", z.object({ repositoryId: z.string() })),
    async (c) => {
      const { repositoryId } = c.req.valid("param");

      try {
        const [repository] = await db
          .select()
          .from(repositories)
          .where(eq(repositories.id, repositoryId))
          .limit(1);

        if (!repository) {
          return c.json({ error: "Repository not found" }, 404);
        }

        const repoSubsystems = await db
          .select()
          .from(subsystems)
          .where(eq(subsystems.repositoryId, repositoryId));

        const pages = await db
          .select({
            id: wikiPages.id,
            title: wikiPages.title,
            content: wikiPages.content,
            citations: wikiPages.citations,
            tableOfContents: wikiPages.tableOfContents,
            createdAt: wikiPages.createdAt,
            subsystem: {
              id: subsystems.id,
              name: subsystems.name,
              description: subsystems.description,
              type: subsystems.type,
              complexity: subsystems.complexity,
            },
          })
          .from(wikiPages)
          .innerJoin(subsystems, eq(wikiPages.subsystemId, subsystems.id))
          .where(eq(subsystems.repositoryId, repositoryId));

        return c.json(
          {
            repository: {
              id: repository.id,
              name: repository.name,
              owner: repository.owner,
              description: repository.description,
              url: repository.url,
              language: repository.language,
              stars: repository.stars,
              analyzedAt: repository.analyzedAt,
            },
            subsystems: repoSubsystems,
            pages,
            hasWiki: pages.length > 0,
          },
          200
        );
      } catch (error) {
        console.error("Error fetching wiki:", error);
        return c.json({ error: "Failed to fetch wiki" }, 500);
      }
    }
  )

  .get(
    "/:repositoryId/page/:subsystemId",
    zValidator(
      "param",
      z.object({
        repositoryId: z.string(),
        subsystemId: z.string(),
      })
    ),
    async (c) => {
      const { subsystemId } = c.req.valid("param");

      try {
        const [page] = await db
          .select({
            id: wikiPages.id,
            title: wikiPages.title,
            content: wikiPages.content,
            citations: wikiPages.citations,
            tableOfContents: wikiPages.tableOfContents,
            createdAt: wikiPages.createdAt,
            updatedAt: wikiPages.updatedAt,
            subsystem: {
              id: subsystems.id,
              name: subsystems.name,
              description: subsystems.description,
              type: subsystems.type,
              files: subsystems.files,
              entryPoints: subsystems.entryPoints,
              dependencies: subsystems.dependencies,
              complexity: subsystems.complexity,
            },
          })
          .from(wikiPages)
          .innerJoin(subsystems, eq(wikiPages.subsystemId, subsystems.id))
          .where(eq(subsystems.id, subsystemId))
          .limit(1);

        if (!page) {
          return c.json({ error: "Wiki page not found" }, 404);
        }

        return c.json({ page }, 200);
      } catch (error) {
        console.error("Error fetching wiki page:", error);
        return c.json({ error: "Failed to fetch wiki page" }, 500);
      }
    }
  );

async function generateWikiInBackground(
  repositoryId: string,
  repository: typeof repositories.$inferSelect,
  repoSubsystems: (typeof subsystems.$inferSelect)[]
) {
  try {
    const { owner, repo } = GitHubService.parseRepoUrl(repository.url);

    for (const subsystem of repoSubsystems) {
      try {
        const wikiContent = await WikiGenerator.generateWikiPage(
          {
            ...subsystem,
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
      } catch (error) {
        console.error(
          `Failed to generate wiki for subsystem ${subsystem.name}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Background wiki generation error:", error);
  }
}

export default app;
