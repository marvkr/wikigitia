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
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { useGetAnalysisStatus } from "@/hooks/use-get-analysis-status";
import { useGetWiki } from "@/hooks/use-get-wiki";

interface AnalysisProgressProps {
  jobId: string;
  onComplete?: (repositoryId: string) => void;
}

export function AnalysisProgress({ jobId, onComplete }: AnalysisProgressProps) {
  console.log(`AnalysisProgress mounted with jobId: ${jobId}`);

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

  useEffect(() => {
    if (!analysisStatus) return;

    const status = analysisStatus.status;

    // Simulate progress based on status
    if (status === "pending") {
      setProgressValue(5);
    } else if (status === "in_progress") {
      // Gradually increase progress while in progress
      const interval = setInterval(() => {
        setProgressValue((prev) => {
          if (prev < 85) {
            return prev + Math.random() * 3; // Gradually increase
          }
          return prev;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (status === "completed") {
      setProgressValue(100);

      if (analysisStatus.repositoryId) {
        // Check if wiki is ready
        if (wikiData?.hasWiki) {
          onComplete?.(analysisStatus.repositoryId);
        }
      }
    } else if (status === "failed") {
      setProgressValue(0);
    }
  }, [analysisStatus, wikiData, onComplete]);

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

  const getStatusText = () => {
    if (isLoading) return "Initializing analysis...";

    const status = analysisStatus?.status;
    switch (status) {
      case "pending":
        return "Analysis queued - starting soon...";
      case "in_progress":
        return "Analyzing repository structure and generating documentation...";
      case "completed":
        return "Analysis completed successfully!";
      case "failed":
        return "Analysis failed";
      default:
        return "Preparing analysis...";
    }
  };

  const getProgressText = () => {
    const status = analysisStatus?.status;
    if (status === "pending") return "Queued";
    if (status === "in_progress") {
      if (progressValue < 20) return "Scanning repository structure...";
      if (progressValue < 50) return "Analyzing code patterns...";
      if (progressValue < 80) return "Generating documentation...";
      return "Finalizing wiki pages...";
    }
    if (status === "completed") return "Complete";
    if (status === "failed") return "Failed";
    return "Initializing...";
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
        <CardDescription>
          Analyzing repository structure and generating comprehensive
          documentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{getProgressText()}</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progressValue)}%
          </span>
        </div>

        <Progress value={progressValue} className="w-full" />

        <div className="text-sm text-muted-foreground">{getStatusText()}</div>

        {analysisStatus?.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{analysisStatus.error}</p>
          </div>
        )}

        {analysisStatus?.result && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md dark:bg-green-400/10 dark:border-green-400/20">
            <p className="text-sm text-green-700 dark:text-green-400">
              Analysis completed! Found {analysisStatus.result.subsystemCount}{" "}
              subsystems.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
