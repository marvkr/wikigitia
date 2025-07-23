"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetWiki } from "@/hooks/use-get-wiki";
import { useCreateWiki } from "@/hooks/use-create-wiki";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen,
  Github,
  Star,
  Code,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Package,
  Globe,
  Settings,
  Terminal,
  Database,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WikiPage() {
  const params = useParams();
  const router = useRouter();
  const repositoryId = params.repositoryId as string;

  const { data: wiki, isLoading, error, refetch } = useGetWiki(repositoryId);

  const { mutate: createWiki, isPending: isGenerating } = useCreateWiki();

  const handleGenerateWiki = () => {
    createWiki(
      { repositoryId },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r bg-muted/30">
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Separator />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load wiki. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!wiki) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Wiki not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 w-full">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Repository Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Github className="h-6 w-6" />
                <h1 className="text-2xl font-bold">
                  {wiki.repository.owner}/{wiki.repository.name}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {wiki.repository.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {wiki.repository.language && (
                  <div className="flex items-center gap-1">
                    <Code className="h-4 w-4" />
                    <span>{wiki.repository.language}</span>
                  </div>
                )}
                {wiki.repository.stars && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{wiki.repository.stars} stars</span>
                  </div>
                )}
              </div>
            </div>
            <Button asChild>
              <a
                href={wiki.repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                View Repository
              </a>
            </Button>
          </div>
        </div>

        {/* Wiki Content */}
        {!wiki.hasWiki ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Wiki Not Generated Yet</CardTitle>
              <CardDescription>
                Generate comprehensive documentation for this repository&apos;s
                architecture and components.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleGenerateWiki}
                disabled={isGenerating}
                size="lg"
                className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Generating Wiki...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Wiki
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                This will analyze {wiki.subsystems.length} subsystems and create
                detailed documentation.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Subsystems Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Subsystems</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {wiki.subsystems.map((subsystem) => {
                  const page = wiki.pages.find(
                    (p) => p.subsystem.id === subsystem.id
                  );
                  const getTypeIcon = (type: string) => {
                    switch (type.toLowerCase()) {
                      case "feature":
                        return <Package className="h-4 w-4" />;
                      case "service":
                        return <Globe className="h-4 w-4" />;
                      case "utility":
                        return <Settings className="h-4 w-4" />;
                      case "cli":
                        return <Terminal className="h-4 w-4" />;
                      case "api":
                        return <Code className="h-4 w-4" />;
                      case "data":
                        return <Database className="h-4 w-4" />;
                      case "core":
                        return <Layers className="h-4 w-4" />;
                      default:
                        return <BookOpen className="h-4 w-4" />;
                    }
                  };

                  const getTypeColor = (type: string) => {
                    switch (type.toLowerCase()) {
                      case "feature":
                        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
                      case "service":
                        return "bg-green-500/10 text-green-500 border-green-500/20";
                      case "utility":
                        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
                      case "cli":
                        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
                      case "api":
                        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
                      case "data":
                        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
                      case "core":
                        return "bg-red-500/10 text-red-500 border-red-500/20";
                      default:
                        return "bg-muted text-muted-foreground";
                    }
                  };

                  return (
                    <Card
                      key={subsystem.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        if (page) {
                          router.push(`/wiki/${repositoryId}/${subsystem.id}`);
                        }
                      }}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg border flex-shrink-0",
                              getTypeColor(subsystem.type)
                            )}>
                            {getTypeIcon(subsystem.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg">
                              {subsystem.name}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {subsystem.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getTypeColor(subsystem.type)
                            )}>
                            {subsystem.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {subsystem.files?.length || 0} files
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
