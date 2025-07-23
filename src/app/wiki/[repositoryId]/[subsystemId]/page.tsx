"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetWikiPage } from "@/hooks/use-get-wiki";
import { CitationLink } from "@/components/citation-link";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Package,
  Globe,
  Settings,
  Terminal,
  Code,
  Database,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "feature":
      return <Package className="h-5 w-5" />;
    case "service":
      return <Globe className="h-5 w-5" />;
    case "utility":
      return <Settings className="h-5 w-5" />;
    case "cli":
      return <Terminal className="h-5 w-5" />;
    case "api":
      return <Code className="h-5 w-5" />;
    case "data":
      return <Database className="h-5 w-5" />;
    case "core":
      return <Layers className="h-5 w-5" />;
    default:
      return <BookOpen className="h-5 w-5" />;
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

const getComplexityColor = (complexity: string) => {
  switch (complexity.toLowerCase()) {
    case "low":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "high":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function SubsystemPage() {
  const params = useParams();
  const router = useRouter();
  const repositoryId = params.repositoryId as string;
  const subsystemId = params.subsystemId as string;

  const {
    data: wikiPage,
    isLoading,
    error,
  } = useGetWikiPage(repositoryId, subsystemId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="w-full px-6 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="w-full px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
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
            Failed to load subsystem page. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!wikiPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Subsystem page not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderContent = (content: string) => {
    // Process the markdown content line by line for better formatting
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Handle code blocks
      if (line.trim().startsWith("```")) {
        const language = line.replace("```", "").trim();
        const codeLines: string[] = [];
        i++; // Skip the opening ```

        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }

        elements.push(
          <CodeBlock
            key={elements.length}
            code={codeLines.join("\n")}
            language={language}
            className="my-6"
          />
        );
        i++; // Skip the closing ```
        continue;
      }

      // Handle headers
      if (line.startsWith("#")) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, "");
        const headerLevel = Math.min(level, 6);

        const headerClasses = cn(
          "font-bold text-foreground mt-8 mb-4 first:mt-0",
          level === 1 && "text-2xl",
          level === 2 && "text-xl border-b pb-2",
          level === 3 && "text-lg",
          level === 4 && "text-base",
          level >= 5 && "text-sm"
        );

        // Create header element based on level
        let headerElement: React.ReactNode;
        switch (headerLevel) {
          case 1:
            headerElement = (
              <h1 key={elements.length} className={headerClasses}>
                {text}
              </h1>
            );
            break;
          case 2:
            headerElement = (
              <h2 key={elements.length} className={headerClasses}>
                {text}
              </h2>
            );
            break;
          case 3:
            headerElement = (
              <h3 key={elements.length} className={headerClasses}>
                {text}
              </h3>
            );
            break;
          case 4:
            headerElement = (
              <h4 key={elements.length} className={headerClasses}>
                {text}
              </h4>
            );
            break;
          case 5:
            headerElement = (
              <h5 key={elements.length} className={headerClasses}>
                {text}
              </h5>
            );
            break;
          default:
            headerElement = (
              <h6 key={elements.length} className={headerClasses}>
                {text}
              </h6>
            );
            break;
        }

        elements.push(headerElement);
        i++;
        continue;
      }

      // Handle paragraphs and inline formatting
      if (line.trim()) {
        const processInlineContent = (text: string) => {
          // Split by code, links, and citations
          const parts = text.split(/(\[.*?\]\(.*?\)|\`[^\`]+\`)/);

          return parts.map((part, index) => {
            // Handle inline code
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={index}
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {part.slice(1, -1)}
                </code>
              );
            }

            // Handle markdown links (potential citations)
            if (part.startsWith("[") && part.includes("](")) {
              const match = part.match(/\[(.*?)\]\((.*?)\)/);
              if (match) {
                const [, text, url] = match;
                const citation = wikiPage.citations.find(
                  (c) => c.text === text || c.url === url
                );
                if (citation) {
                  return <CitationLink key={index} citation={citation} />;
                } else {
                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline">
                      {text}
                    </a>
                  );
                }
              }
            }

            // Handle bold and italic (basic markdown)
            return <span key={index}>{part}</span>;
          });
        };

        elements.push(
          <p
            key={elements.length}
            className="mb-4 leading-relaxed text-foreground">
            {processInlineContent(line)}
          </p>
        );
      } else {
        // Empty line - add some spacing
        elements.push(<div key={elements.length} className="mb-2" />);
      }

      i++;
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="w-full px-4 md:px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/wiki/${repositoryId}`)}
            className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wiki
          </Button>

          <div className="flex items-start gap-3 md:gap-4">
            <div
              className={cn(
                "p-2 rounded-lg border flex-shrink-0",
                getTypeColor(wikiPage.subsystem.type)
              )}>
              {getTypeIcon(wikiPage.subsystem.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold mb-2 break-words">
                {wikiPage.title}
              </h1>
              <p className="text-muted-foreground mb-3 text-sm md:text-base line-clamp-3">
                {wikiPage.subsystem.description}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    getTypeColor(wikiPage.subsystem.type)
                  )}>
                  {wikiPage.subsystem.type}
                </Badge>
                {wikiPage.subsystem.complexity && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      getComplexityColor(wikiPage.subsystem.complexity)
                    )}>
                    {wikiPage.subsystem.complexity} complexity
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Wiki Content */}
          <Card>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-6">
              <div className="space-y-4 text-foreground leading-relaxed">
                {renderContent(wikiPage.content)}
              </div>
            </CardContent>
          </Card>

          {/* Citations */}
          {wikiPage.citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                  Citations ({wikiPage.citations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 md:space-y-3">
                {wikiPage.citations.map((citation, index) => (
                  <CitationLink
                    key={index}
                    citation={citation}
                    variant="block"
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
