import { Hono } from "hono";
import { handle } from "hono/vercel";
import { rateLimiter } from "hono-rate-limiter";
import analyze from "./analyze";
import wiki from "./wiki";
import repositories from "./repositories";

const app = new Hono().basePath("/api");

// Add global rate limiting to prevent DDOS attacks
const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: "draft-7", // Use combined RateLimit header
  keyGenerator: (c) => {
    // Use IP address as the key for rate limiting
    const forwarded = c.req.header("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : c.req.header("x-real-ip") || "unknown";
    return ip;
  },
});

// Apply rate limiting to all API routes
app.use("/*", limiter);

// Mount all route modules
const finalApp = app
  .route("/analyze", analyze)
  .route("/wiki", wiki)
  .route("/repositories", repositories);

export const GET = handle(finalApp);
export const POST = handle(finalApp);

// Export type for RPC client
export type AppType = typeof finalApp;
