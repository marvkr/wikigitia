import { Hono } from "hono";
import { db } from "@/db/drizzle";
import { repositories } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";

const app = new Hono().get("/recent", async (c) => {
  try {
    const recentRepositories = await db
      .select({
        id: repositories.id,
        url: repositories.url,
        owner: repositories.owner,
        name: repositories.name,
        description: repositories.description,
        language: repositories.language,
        stars: repositories.stars,
        analyzedAt: repositories.analyzedAt,
      })
      .from(repositories)
      .where(isNotNull(repositories.analyzedAt))
      .orderBy(desc(repositories.analyzedAt))
      .limit(10);

    return c.json(recentRepositories);
  } catch (error) {
    console.error("Error fetching recent repositories:", error);
    return c.json({ error: "Failed to fetch recent repositories" }, 500);
  }
});

export default app;
