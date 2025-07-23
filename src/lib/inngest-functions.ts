import { inngest } from "./inngest";
import { db } from "@/db/drizzle";
import { repositories, analysisJobs, subsystems, wikiPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { GitHubService } from "./github";
import { AIAnalyzer } from "./analyzer";
import { WikiGenerator } from "./wiki-generator";

// Repository Analysis Function
export const analyzeRepository = inngest.createFunction(
  { id: "analyze-repository" },
  { event: "repository/analyze" },
  async ({ event, step }) => {
    const { jobId, repositoryId, owner, repo } = event.data;

    // Step 1: Update job status to in_progress
    await step.run("update-job-status", async () => {
      await db
        .update(analysisJobs)
        .set({
          status: "in_progress",
        })
        .where(eq(analysisJobs.id, jobId));
    });

    // Step 2: Check if this is a re-analysis
    const isReanalysis = await step.run("check-reanalysis", async () => {
      const [existingRepo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1);

      return existingRepo && existingRepo.analyzedAt !== null;
    });

    // Step 3: Get repository structure
    const files = await step.run("get-repository-structure", async () => {
      return await GitHubService.getAllFiles(owner, repo);
    });

    // Step 4: AI Analysis
    const analysis = await step.run("ai-analysis", async () => {
      return await AIAnalyzer.analyzeRepository(owner, repo, files);
    });

    // Step 5: Store/Update subsystems
    await step.run("store-subsystems", async () => {
      if (isReanalysis) {
        console.log("Re-analysis: updating existing subsystems");

        // Get existing subsystems
        const existingSubsystems = await db
          .select()
          .from(subsystems)
          .where(eq(subsystems.repositoryId, repositoryId));

        // Create a map for easier lookup
        const existingSubsystemMap = new Map(
          existingSubsystems.map((sub) => [sub.name, sub])
        );

        // Update or insert subsystems
        for (const subsystem of analysis.subsystems) {
          const existing = existingSubsystemMap.get(subsystem.name);

          if (existing) {
            // Update existing subsystem
            await db
              .update(subsystems)
              .set({
                description: subsystem.description,
                type: subsystem.type,
                files: subsystem.files,
                entryPoints: subsystem.entryPoints,
                dependencies: subsystem.dependencies,
                complexity: subsystem.complexity,
                updatedAt: new Date(),
              })
              .where(eq(subsystems.id, existing.id));
          } else {
            // Insert new subsystem
            await db.insert(subsystems).values({
              id: nanoid(),
              repositoryId,
              name: subsystem.name,
              description: subsystem.description,
              type: subsystem.type,
              files: subsystem.files,
              entryPoints: subsystem.entryPoints,
              dependencies: subsystem.dependencies,
              complexity: subsystem.complexity,
            });
          }
        }
      } else {
        console.log("First analysis: creating new subsystems");

        // Insert new subsystems for first-time analysis
        for (const subsystem of analysis.subsystems) {
          await db.insert(subsystems).values({
            id: nanoid(),
            repositoryId,
            name: subsystem.name,
            description: subsystem.description,
            type: subsystem.type,
            files: subsystem.files,
            entryPoints: subsystem.entryPoints,
            dependencies: subsystem.dependencies,
            complexity: subsystem.complexity,
          });
        }
      }
    });

    // Step 6: Update repository analyzed timestamp
    await step.run("update-repository-timestamp", async () => {
      await db
        .update(repositories)
        .set({
          analyzedAt: new Date(),
        })
        .where(eq(repositories.id, repositoryId));
    });

    // Step 7: Complete analysis job
    await step.run("complete-analysis-job", async () => {
      await db
        .update(analysisJobs)
        .set({
          status: "completed",
          completedAt: new Date(),
          result: {
            summary: analysis.summary,
            subsystemCount: analysis.subsystems.length,
          },
        })
        .where(eq(analysisJobs.id, jobId));
    });

    // Step 8: Trigger wiki generation
    await step.run("trigger-wiki-generation", async () => {
      await inngest.send({
        name: "wiki/generate",
        data: {
          repositoryId,
          owner,
          repo,
          force: isReanalysis,
        },
      });
    });

    return {
      success: true,
      repositoryId,
      subsystemCount: analysis.subsystems.length,
    };
  }
);

// Wiki Generation Function
export const generateWiki = inngest.createFunction(
  { id: "generate-wiki" },
  { event: "wiki/generate" },
  async ({ event, step }) => {
    const { repositoryId, owner, repo, force = false } = event.data;

    // Step 1: Get repository and subsystems
    const { repository, repoSubsystems } = await step.run(
      "get-repository-data",
      async () => {
        const [repository] = await db
          .select()
          .from(repositories)
          .where(eq(repositories.id, repositoryId))
          .limit(1);

        if (!repository) {
          throw new Error("Repository not found for wiki generation");
        }

        const repoSubsystems = await db
          .select()
          .from(subsystems)
          .where(eq(subsystems.repositoryId, repositoryId));

        if (repoSubsystems.length === 0) {
          throw new Error("No subsystems found for wiki generation");
        }

        return { repository, repoSubsystems };
      }
    );

    // Step 2: Check if wiki already exists (unless forcing)
    const shouldSkip = await step.run("check-wiki-exists", async () => {
      if (!force) {
        const existingPages = await db
          .select()
          .from(wikiPages)
          .where(eq(wikiPages.subsystemId, repoSubsystems[0].id))
          .limit(1);

        if (existingPages.length > 0) {
          console.log("Wiki already exists, skipping generation");
          return true;
        }
      } else {
        console.log("Force regeneration: updating existing wiki pages");
      }
      return false;
    });

    if (shouldSkip) {
      return {
        success: true,
        message: "Wiki already exists, skipped generation",
      };
    }

    // Step 3: Generate wiki pages for each subsystem
    const results = await step.run("generate-wiki-pages", async () => {
      const results = [];

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

          if (force) {
            // Check if wiki page already exists for this subsystem
            const [existingPage] = await db
              .select()
              .from(wikiPages)
              .where(eq(wikiPages.subsystemId, subsystem.id))
              .limit(1);

            if (existingPage) {
              // Update existing wiki page
              await db
                .update(wikiPages)
                .set({
                  title: wikiContent.title,
                  content: wikiContent.content,
                  citations: wikiContent.citations,
                  tableOfContents: wikiContent.tableOfContents,
                  updatedAt: new Date(),
                })
                .where(eq(wikiPages.id, existingPage.id));

              console.log(
                `✓ Updated wiki page for subsystem: ${subsystem.name}`
              );
            } else {
              // Create new wiki page if it doesn't exist
              const pageId = nanoid();
              await db.insert(wikiPages).values({
                id: pageId,
                subsystemId: subsystem.id,
                title: wikiContent.title,
                content: wikiContent.content,
                citations: wikiContent.citations,
                tableOfContents: wikiContent.tableOfContents,
              });

              console.log(
                `✓ Created new wiki page for subsystem: ${subsystem.name}`
              );
            }
          } else {
            // First-time generation: always create new pages
            const pageId = nanoid();
            await db.insert(wikiPages).values({
              id: pageId,
              subsystemId: subsystem.id,
              title: wikiContent.title,
              content: wikiContent.content,
              citations: wikiContent.citations,
              tableOfContents: wikiContent.tableOfContents,
            });

            console.log(
              `✓ Generated wiki page for subsystem: ${subsystem.name}`
            );
          }

          results.push({ subsystem: subsystem.name, success: true });
        } catch (error) {
          console.error(
            `✗ Failed to generate wiki for subsystem ${subsystem.name}:`,
            error instanceof Error ? error.message : error
          );
          results.push({
            subsystem: subsystem.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    });

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `Wiki generation completed for repository: ${repository.name} (${successCount}/${repoSubsystems.length} subsystems successful)`
    );

    return {
      success: true,
      repositoryId,
      repositoryName: repository.name,
      totalSubsystems: repoSubsystems.length,
      successfulSubsystems: successCount,
      results,
    };
  }
);

// Export all functions
export const functions = [analyzeRepository, generateWiki];
