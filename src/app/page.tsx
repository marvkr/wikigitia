"use client";

import { useState, useEffect, Suspense } from "react";
import { Github } from "lucide-react";
import { RepositoryInputForm } from "@/components/repository-input-form";
import { AnalysisProgress } from "@/components/analysis-progress";
import { useRouter, useSearchParams } from "next/navigation";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentRepositoryId, setCurrentRepositoryId] = useState<string | null>(
    null
  );
  const [reAnalyzeUrl, setReAnalyzeUrl] = useState<string | null>(null);

  // Handle reanalyze URL from search params
  useEffect(() => {
    const reanalyzeParam = searchParams.get("reanalyze");
    if (reanalyzeParam) {
      setReAnalyzeUrl(decodeURIComponent(reanalyzeParam));
      // Clear the URL parameter
      router.replace("/");
    }
  }, [searchParams, router]);

  // Handle redirect to wiki page when analysis is complete
  useEffect(() => {
    if (currentRepositoryId) {
      router.push(`/wiki/${currentRepositoryId}`);
    }
  }, [currentRepositoryId, router]);

  const handleAnalysisStarted = (jobId: string) => {
    setCurrentJobId(jobId);
    setCurrentRepositoryId(null);
  };

  const handleAnalysisComplete = (repoId: string) => {
    setCurrentRepositoryId(repoId);
    setCurrentJobId(null);
  };

  const handleNewAnalysis = () => {
    setCurrentJobId(null);
    setCurrentRepositoryId(null);
    setReAnalyzeUrl(null);
  };

  // Clear analysis state when navigating back to home page
  useEffect(() => {
    const handleRouteChange = () => {
      // If we're on the home page and there's no active analysis, clear state
      if (window.location.pathname === "/" && !searchParams.get("reanalyze")) {
        setCurrentJobId(null);
        setCurrentRepositoryId(null);
      }
    };

    // Listen for browser back/forward navigation
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [searchParams]);

  // Show loading spinner while redirecting to wiki
  if (currentRepositoryId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to wiki...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
              <Github className="h-10 w-10" />
              Wikigitia
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform any GitHub repository into comprehensive, AI-generated
              documentation. Perfect for developers who want to understand
              codebases quickly.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {!currentJobId ? (
              <RepositoryInputForm
                onAnalysisStarted={handleAnalysisStarted}
                initialUrl={reAnalyzeUrl || undefined}
              />
            ) : (
              <div className="space-y-6">
                <AnalysisProgress
                  jobId={currentJobId}
                  onComplete={handleAnalysisComplete}
                />

                <div className="text-center">
                  <button
                    onClick={handleNewAnalysis}
                    className="text-sm text-muted-foreground hover:text-foreground underline">
                    ← Start a new analysis
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center p-6 bg-card rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">
                Intelligent Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis identifies key subsystems, features, and
                architecture patterns
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">
                Rich Citations
              </h3>
              <p className="text-sm text-muted-foreground">
                Every claim is backed by direct links to specific lines of code
                in the repository
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">
                Wiki-Style Docs
              </h3>
              <p className="text-sm text-muted-foreground">
                Navigate through organized, readable documentation with table of
                contents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }>
      <HomeContent />
    </Suspense>
  );
}
