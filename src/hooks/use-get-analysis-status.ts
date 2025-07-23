import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

interface AnalysisStatusResponse {
  jobId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: string;
  startedAt: string;
  completedAt?: string;
  repositoryId?: string;
  result?: {
    summary: string;
    subsystemCount: number;
  };
  error?: string;
}

export const useGetAnalysisStatus = (jobId?: string) => {
  const query = useQuery({
    queryKey: ["analysis-status", jobId],
    queryFn: async (): Promise<AnalysisStatusResponse> => {
      if (!jobId) throw new Error("Job ID is required");

      const response = await client.api.analyze[":jobId"].$get({
        param: { jobId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analysis status");
      }

      return (await response.json()) as AnalysisStatusResponse;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Only refetch if analysis is still in progress
      const status = query.state.data?.status;
      const shouldPoll = status === "in_progress" || status === "pending";

      if (shouldPoll) {
        console.log(`Polling analysis status: ${status}`);
        return 2000;
      }

      console.log(`Stopped polling analysis status: ${status}`);
      return false;
    },
  });

  return query;
};
