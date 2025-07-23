import { Hono } from "hono";
import { handle } from "hono/vercel";
import analyze from "./analyze";
import wiki from "./wiki";
import { db } from "@/db/drizzle";
import { repositories } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";

const app = new Hono().basePath("/api");

// Mount existing routes
app.route("/analyze", analyze);
app.route("/wiki", wiki);

// Recent repositories endpoint for search history
app.get("/repositories/recent", async (c) => {
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

export const GET = handle(app);
export const POST = handle(app);
