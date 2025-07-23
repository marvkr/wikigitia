import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

// Get the base URL for API calls
const getBaseUrl = () => {
  // In browser context, use the current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // In server context, use Vercel's automatic URL or localhost for development
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const client = hc<AppType>(getBaseUrl());
