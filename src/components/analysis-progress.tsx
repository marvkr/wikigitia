"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useGetAnalysisStatus } from "@/hooks/use-get-analysis-status";
import { useGetWiki } from "@/hooks/use-get-wiki";
import { useSearchHistory } from "@/hooks/use-search-history";

interface AnalysisProgressProps {
  jobId: string;
  onComplete?: (repositoryId: string) => void;
}

export function AnalysisProgress({ jobId, onComplete }: AnalysisProgressProps) {
  const {
    data: analysisStatus,
    isLoading,
    error,
  } = useGetAnalysisStatus(jobId);
  const { data: wikiData } = useGetWiki(
    analysisStatus?.status === "completed"
      ? analysisStatus.repositoryId
      : undefined,
    {
      refetchInterval: analysisStatus?.status === "completed" ? 2000 : false,
    }
  );

  const [progressValue, setProgressValue] = useState(0);
  const { addToHistory } = useSearchHistory();

  useEffect(() => {
    if (!analysisStatus) return;

    const status = analysisStatus.status;
    const progress = analysisStatus.progress;

    // Convert progress string to number
    const progressNum = parseInt(progress.replace("%", "")) || 0;
    setProgressValue(progressNum);

    if (status === "completed" && analysisStatus.repositoryId) {
      // Check if wiki is ready
      if (wikiData?.hasWiki) {
        // Add to search history
        const repository = wikiData.repository;
        console.log("Adding repository to history:", repository);
        addToHistory({
          repositoryId: analysisStatus.repositoryId,
          url: repository.url,
          owner: repository.owner,
          name: repository.name,
          description: repository.description,
          language: repository.language,
          stars: repository.stars,
        });

        onComplete?.(analysisStatus.repositoryId);
      }
    }
  }, [analysisStatus, wikiData, onComplete, addToHistory]);

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

    const status = analysisStatus?.status;
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-foreground" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin text-foreground" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Analysis Failed
          </CardTitle>
          <CardDescription>
            Failed to fetch analysis status: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Repository Analysis
        </CardTitle>
        {!isLoading && <CardDescription>Job ID: {jobId}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {analysisStatus?.status === "completed"
              ? "Completed"
              : analysisStatus?.status === "in_progress"
              ? "In Progress"
              : analysisStatus?.status === "pending"
              ? "Pending"
              : analysisStatus?.status === "failed"
              ? "Failed"
              : "Progress"}
          </span>
        </div>

        <Progress value={progressValue} className="w-full" />

        <div className="text-sm text-muted-foreground">
          {analysisStatus?.progress || "Initializing..."}
        </div>

        {analysisStatus?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{analysisStatus.error}</p>
          </div>
        )}

        {analysisStatus?.status === "completed" &&
          analysisStatus.repositoryId && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-600">
                    Analysis Complete!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Found {analysisStatus.result?.subsystemCount || 0}{" "}
                    subsystems. Wiki is being generated automatically...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                  <span className="text-sm text-green-600">
                    Generating Wiki
                  </span>
                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
