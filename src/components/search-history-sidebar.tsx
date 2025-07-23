"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  GitBranch,
  Clock,
  ExternalLink,
  RotateCcw,
  Github,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRecentRepositories } from "@/hooks/use-recent-repositories";

interface SearchHistorySidebarProps {
  onViewWiki?: (repositoryId: string) => void;
  onReanalyze?: (url: string) => void;
}

export function SearchHistorySidebar({
  onViewWiki,
  onReanalyze,
}: SearchHistorySidebarProps = {}) {
  const router = useRouter();
  const { data: repositories = [], isLoading, error } = useRecentRepositories();

  const handleViewWiki = (repositoryId: string) => {
    if (onViewWiki) {
      onViewWiki(repositoryId);
    } else {
      router.push(`/wiki/${repositoryId}`);
    }
  };

  const handleReanalyze = (url: string) => {
    if (onReanalyze) {
      onReanalyze(url);
    } else {
      // Navigate to home with the URL - this will auto-trigger analysis
      router.push(`/?reanalyze=${encodeURIComponent(url)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
        <p className="text-sm">Loading repositories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Github className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Failed to load repositories</p>
        <p className="text-xs">Please try again later</p>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Github className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No repositories analyzed yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm truncate">Recent Repositories</h3>
      </div>

      <div className="space-y-3 overflow-hidden">
        {repositories.map((repo, index) => (
          <div key={repo.id} className="group">
            <div className="space-y-2">
              <div className="flex items-start gap-2 min-w-0">
                <GitBranch className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="text-sm font-medium truncate"
                    title={`${repo.owner}/${repo.name}`}>
                    {repo.owner}/{repo.name}
                  </p>
                  {repo.description && (
                    <p
                      className="text-xs text-muted-foreground mt-1 break-words"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                      {repo.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate flex-1">
                  {formatDistanceToNow(new Date(repo.analyzedAt), {
                    addSuffix: true,
                  })}
                </span>
                {repo.language && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1 py-0 flex-shrink-0">
                    {repo.language}
                  </Badge>
                )}
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewWiki(repo.id)}
                  className="h-7 px-2 text-xs justify-start">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Wiki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReanalyze(repo.url)}
                  className="h-7 px-2 text-xs justify-start">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Re-analyze
                </Button>
              </div>
            </div>

            {index < repositories.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </div>
    </div>
  );
}
