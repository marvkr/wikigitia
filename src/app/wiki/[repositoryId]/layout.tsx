"use client";

import { useParams } from "next/navigation";
import { useGetWiki } from "@/hooks/use-get-wiki";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const repositoryId = params.repositoryId as string;

  // Pre-fetch wiki data at layout level to share across all wiki pages
  const { isLoading, error } = useGetWiki(repositoryId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 md:p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load wiki. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}