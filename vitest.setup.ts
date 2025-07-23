import { beforeAll } from "vitest";
import { config } from "dotenv";

beforeAll(() => {
  // Load environment variables for testing
  config({ path: ".env.local" });

  // Set test environment variables
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  // Mock environment variables for testing
  process.env.OPENAI_API_KEY = "test-api-key";
  process.env.GITHUB_TOKEN = "test-github-token";
  process.env.DATABASE_URL = "test-database-url";
});
