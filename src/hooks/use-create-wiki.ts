import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { toast } from "@/components/ui/use-toast";

interface GenerateWikiRequest {
  repositoryId: string;
}

interface GenerateWikiResponse {
  message: string;
  repositoryId: string;
  subsystemCount: number;
}

export const useCreateWiki = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ repositoryId }: GenerateWikiRequest): Promise<GenerateWikiResponse> => {
      const response = await client.api.wiki.generate[":repositoryId"].$post({
        param: { repositoryId },
      });

      if (!response.ok) {
        throw new Error("Failed to generate wiki");
      }

      return await response.json() as GenerateWikiResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "Wiki Generated",
        description: `Wiki has been generated with ${data.subsystemCount} subsystems`,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["wikis"] });
      queryClient.invalidateQueries({ queryKey: ["wiki", data.repositoryId] });
    },
    onError: (error) => {
      toast({
        title: "Wiki Generation Failed",
        description: error.message || "Failed to generate wiki",
        variant: "destructive",
      });
    },
  });

  return mutation;
};