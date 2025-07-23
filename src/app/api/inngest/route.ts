import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { functions } from "@/lib/inngest-functions";

// Serve Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
