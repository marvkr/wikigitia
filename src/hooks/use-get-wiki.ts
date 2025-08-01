import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

interface WikiResponse {
  repository: {
    id: string;
    name: string;
    owner: string;
    description: string;
    url: string;
    language: string;
    stars: string;
    analyzedAt: string;
  };
  subsystems: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    files: string[];
    entryPoints: string[];
    dependencies: string[];
    complexity: string;
  }>;
  pages: Array<{
    id: string;
    title: string;
    content: string;
    citations: Array<{
      text: string;
      file: string;
      startLine: number;
      endLine: number;
      url: string;
      context: string;
    }>;
    tableOfContents: Array<{
      title: string;
      anchor: string;
      level: number;
    }>;
    createdAt: string;
    subsystem: {
      id: string;
      name: string;
      description: string;
      type: string;
      complexity: string;
    };
  }>;
  hasWiki: boolean;
}

export const useGetWiki = (
  repositoryId?: string,
  options?: { refetchInterval?: number | false }
) => {
  const query = useQuery({
    queryKey: ["wiki", repositoryId],
    queryFn: async (): Promise<WikiResponse> => {
      if (!repositoryId) throw new Error("Repository ID is required");

      const response = await client.api.wiki[":repositoryId"].$get({
        param: { repositoryId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wiki");
      }

      return (await response.json()) as WikiResponse;
    },
    enabled: !!repositoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes - wiki data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache even longer
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: false, // Never refetch on focus
    refetchOnMount: false, // Use cached data on mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  return query;
};

interface WikiPageResponse {
  id: string;
  title: string;
  content: string;
  citations: Array<{
    text: string;
    file: string;
    startLine: number;
    endLine: number;
    url: string;
    context: string;
  }>;
  tableOfContents: Array<{
    title: string;
    anchor: string;
    level: number;
  }>;
  createdAt: string;
  updatedAt: string;
  subsystem: {
    id: string;
    name: string;
    description: string;
    type: string;
    files: string[];
    entryPoints: string[];
    dependencies: string[];
    complexity: string;
  };
}

export const useGetWikiPage = (repositoryId?: string, subsystemId?: string) => {
  const query = useQuery({
    queryKey: ["wiki-page", repositoryId, subsystemId],
    queryFn: async (): Promise<WikiPageResponse> => {
      if (!repositoryId || !subsystemId)
        throw new Error("Repository ID and Subsystem ID are required");

      const response = await client.api.wiki[":repositoryId"].page[
        ":subsystemId"
      ].$get({
        param: { repositoryId, subsystemId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wiki page");
      }

      const data = await response.json();
      return data.page as WikiPageResponse;
    },
    enabled: !!repositoryId && !!subsystemId,
    staleTime: 15 * 60 * 1000, // 15 minutes - individual wiki pages change even less
    gcTime: 60 * 60 * 1000, // 1 hour - keep individual pages in cache much longer
    refetchOnWindowFocus: false, // Never refetch on focus
    refetchOnMount: false, // Always use cached data on mount
    refetchOnReconnect: false, // Don't refetch on reconnect
    notifyOnChangeProps: ['data', 'error'], // Only re-render when data or error changes
  });

  return query;
};
