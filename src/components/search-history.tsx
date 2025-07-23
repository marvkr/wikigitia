"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Github, Trash2, RotateCcw, ExternalLink } from "lucide-react";
import { useSearchHistory } from "@/hooks/use-search-history";

interface SearchHistoryProps {
  onSelectRepository: (repositoryId: string) => void;
  onAnalyzeRepository: (url: string) => void;
}

export function SearchHistory({
  onSelectRepository,
  onAnalyzeRepository,
}: SearchHistoryProps) {
  const { history, removeFromHistory, clearHistory } = useSearchHistory();

  // Debug logging
  console.log("SearchHistory render - history length:", history.length);
  console.log("SearchHistory render - history:", history);

  if (history.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Recent Analyses
          </CardTitle>
          <CardDescription>
            Your analyzed repositories will appear here for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No previous analyses yet</p>
            <p className="text-sm">Analyze a repository to see it here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Recent Analyses
            </CardTitle>
            <CardDescription>
              Quick access to your previously analyzed repositories
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Github className="h-4 w-4 shrink-0" />
                    <h3 className="font-medium text-sm truncate">
                      {item.owner}/{item.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-6 w-6 p-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on GitHub">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(item.analyzedAt)}</span>
                    {item.language && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {item.language}
                        </Badge>
                      </>
                    )}
                    {item.stars && (
                      <>
                        <span>•</span>
                        <span>⭐ {item.stars}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectRepository(item.repositoryId)}
                    className="gap-1 text-xs">
                    View Wiki
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAnalyzeRepository(item.url)}
                    className="gap-1 text-xs"
                    title="Re-analyze repository">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromHistory(item.id)}
                    className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                    title="Remove from history">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {index < history.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
