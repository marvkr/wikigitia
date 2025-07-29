"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Loader2, XCircle, Plus } from "lucide-react";
import { useGetAnalysisStatus } from "@/hooks/use-get-analysis-status";
import { useGetWiki } from "@/hooks/use-get-wiki";
import { useToast } from "@/components/ui/use-toast";

interface AnalysisProgressProps {
  jobId: string;
  onComplete?: (repositoryId: string) => void;
}

export function AnalysisProgress({ jobId, onComplete }: AnalysisProgressProps) {
  console.log(`AnalysisProgress mounted with jobId: ${jobId}`);
  const { toast } = useToast();

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

  const [currentPhase, setCurrentPhase] = useState<
    "analysis" | "wiki-generation" | "completed"
  >("analysis");
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (!analysisStatus) return;

    const status = analysisStatus.status;

    if (status === "pending") {
      setCurrentPhase("analysis");
    } else if (status === "in_progress") {
      setCurrentPhase("analysis");
    } else if (status === "completed") {
      setCurrentPhase("wiki-generation");

      if (analysisStatus.repositoryId) {
        // Check if wiki is ready
        if (wikiData?.hasWiki) {
          setCurrentPhase("completed");
          
          // Show toast notification when wiki is complete
          if (!hasNotified) {
            toast({
              title: "✅ Wiki Generated Successfully!",
              description: `Documentation is ready for ${analysisStatus.repositoryName || 'your repository'}`,
              duration: 5000,
            });
            setHasNotified(true);
          }
          
          onComplete?.(analysisStatus.repositoryId);
        }
      }
    } else if (status === "failed") {
      setCurrentPhase("analysis");
      
      // Show error toast
      if (!hasNotified) {
        toast({
          title: "❌ Analysis Failed",
          description: analysisStatus.error || "Something went wrong during analysis",
          variant: "destructive",
          duration: 5000,
        });
        setHasNotified(true);
      }
    }
  }, [analysisStatus, wikiData, onComplete, toast, hasNotified]);

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

    const status = analysisStatus?.status;

    if (status === "completed") {
      if (currentPhase === "wiki-generation") {
        return <Loader2 className="h-4 w-4 animate-spin text-foreground" />;
      } else if (currentPhase === "completed") {
        return <CheckCircle className="h-4 w-4 text-primary" />;
      }
    }

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
    if (isLoading) return "Initializing...";

    const status = analysisStatus?.status;

    if (status === "completed") {
      if (currentPhase === "wiki-generation") {
        return "Creating comprehensive documentation for each subsystem";
      } else if (currentPhase === "completed") {
        return "Ready to explore your repository documentation";
      }
    }

    switch (status) {
      case "pending":
        return "Queued for processing";
      case "in_progress":
        return "Scanning code structure and identifying components";
      case "completed":
        return "Repository analysis complete";
      case "failed":
        return analysisStatus?.error || "Something went wrong";
      default:
        return "Getting ready...";
    }
  };

  const getPhaseText = () => {
    const status = analysisStatus?.status;

    if (status === "pending") return "Analysis Starting";
    if (status === "in_progress") return "Repository Analysis";
    if (status === "completed") {
      if (currentPhase === "wiki-generation") return "Wiki Generation";
      if (currentPhase === "completed") return "Documentation Complete";
      return "Analysis Complete";
    }
    if (status === "failed") return "Analysis Failed";
    return "Initializing";
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
          {currentPhase === "wiki-generation"
            ? "Generating Documentation"
            : currentPhase === "completed"
            ? "Documentation Complete"
            : "Repository Analysis"}
        </CardTitle>
        <CardDescription>
          {currentPhase === "wiki-generation"
            ? "Creating comprehensive wiki pages for each subsystem"
            : currentPhase === "completed"
            ? "Your repository documentation is ready to explore"
            : "Analyzing repository structure and identifying key subsystems"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-center space-x-3">
          <div className="text-center">
            <div className="text-lg font-medium">{getPhaseText()}</div>
            <div className="text-sm text-muted-foreground mt-1">{getStatusText()}</div>
          </div>
        </div>

        {/* Suggestion to start new analysis */}
        {currentPhase !== "completed" && (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              This may take a few minutes. Feel free to analyze another repository while you wait!
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Analyze Another Repository
            </Button>
          </div>
        )}

        {/* Results */}
        {analysisStatus?.result && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-green-700 dark:text-green-400">
              ✅ Found {analysisStatus.result.subsystemCount} subsystems
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 mt-1">
              Now generating comprehensive documentation...
            </div>
          </div>
        )}

        {analysisStatus?.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-destructive mb-2">
              ❌ Analysis Failed
            </div>
            <div className="text-xs text-destructive/80">
              {analysisStatus.error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
