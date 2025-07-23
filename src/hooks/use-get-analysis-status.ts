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
      // Refetch every 2 seconds if analysis is in progress
      if (
        query.state.data?.status === "in_progress" ||
        query.state.data?.status === "pending"
      ) {
        return 2000;
      }
      return false;
    },
  });

  return query;
};
