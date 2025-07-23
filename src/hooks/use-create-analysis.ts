import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { toast } from "@/components/ui/use-toast";

interface AnalyzeRepositoryRequest {
  url: string;
}

interface AnalyzeRepositoryResponse {
  jobId: string;
  repositoryId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  message: string;
}

export const useCreateAnalysis = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (
      json: AnalyzeRepositoryRequest
    ): Promise<AnalyzeRepositoryResponse> => {
      const response = await client.api.analyze.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to start repository analysis");
      }

      return (await response.json()) as AnalyzeRepositoryResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Started",
        description:
          "Repository analysis has been queued and will begin shortly.",
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["analysis-jobs"] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to start repository analysis",
        variant: "destructive",
      });
    },
  });

  return mutation;
};
