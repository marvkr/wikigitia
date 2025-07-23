"use client";

import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  FileText,
  Layers,
} from "lucide-react";
import { useGetWiki, useGetWikiPage } from "@/hooks/use-get-wiki";
import { Navbar } from "@/components/navbar";

interface WikiDisplayProps {
  repositoryId: string;
  onBack?: () => void;
}

export function WikiDisplay({ repositoryId, onBack }: WikiDisplayProps) {
  const { data: wikiData, isLoading, error } = useGetWiki(repositoryId);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(
    null
  );

  const { data: pageData } = useGetWikiPage(
    repositoryId,
    selectedSubsystemId || undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wiki...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <FileText className="h-5 w-5" />
            Failed to Load Wiki
          </CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!wikiData?.hasWiki) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Wiki Not Ready
          </CardTitle>
          <CardDescription>
            The wiki is still being generated. Please wait a moment and refresh
            the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const repository = wikiData.repository;
  const subsystems = wikiData.subsystems;
  const currentPage = pageData;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <h1 className="text-2xl font-bold">
                  {repository.owner}/{repository.name}
                </h1>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>

            {repository.description && (
              <p className="text-muted-foreground mb-4">
                {repository.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {subsystems.length} subsystems
              </div>
              <div>Language: {repository.language}</div>
              <div>⭐ {repository.stars} stars</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subsystems</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[700px]">
                    <div className="p-4 space-y-2">
                      {subsystems.map((subsystem) => (
                        <Button
                          key={subsystem.id}
                          variant="ghost"
                          className={`w-full justify-start text-left h-auto p-3 min-h-[90px] border-2 ${
                            selectedSubsystemId === subsystem.id
                              ? "bg-muted border-primary text-foreground"
                              : "border-transparent hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedSubsystemId(subsystem.id)}>
                          <div className="space-y-2 w-full">
                            <div className="font-medium text-sm leading-tight break-words whitespace-normal">
                              {subsystem.name}
                            </div>
                            {subsystem.description && (
                              <div className="text-xs text-muted-foreground leading-relaxed break-words whitespace-normal">
                                {subsystem.description}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0.5 shrink-0">
                                {subsystem.type}
                              </Badge>
                              {subsystem.complexity && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 shrink-0">
                                  {subsystem.complexity}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8">
              {currentPage ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{currentPage.title}</CardTitle>
                    <CardDescription>
                      Last updated:{" "}
                      {currentPage.updatedAt
                        ? new Date(currentPage.updatedAt).toLocaleDateString()
                        : "Recently"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: currentPage.content,
                        }}
                        className="whitespace-pre-wrap"
                      />
                    </div>

                    {currentPage.citations &&
                      currentPage.citations.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div>
                            <h3 className="text-lg font-semibold mb-4">
                              Citations
                            </h3>
                            <div className="space-y-2">
                              {currentPage.citations.map((citation, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-muted rounded-lg">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {citation.text}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {citation.file} (lines{" "}
                                        {citation.startLine}-{citation.endLine})
                                      </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                      <a
                                        href={citation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gap-1">
                                        <ExternalLink className="h-3 w-3" />
                                        View
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Select a Subsystem
                      </h3>
                      <p className="text-muted-foreground">
                        Choose a subsystem from the sidebar to view its
                        documentation.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
