import { useQuery } from "@tanstack/react-query";

export interface RecentRepository {
  id: string;
  url: string;
  owner: string;
  name: string;
  description?: string;
  language?: string;
  stars?: string;
  analyzedAt: string;
}

export const useRecentRepositories = () => {
  return useQuery({
    queryKey: ["recent-repositories"],
    queryFn: async (): Promise<RecentRepository[]> => {
      const response = await fetch("/api/repositories/recent");
      if (!response.ok) {
        throw new Error("Failed to fetch recent repositories");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
