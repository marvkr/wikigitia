"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Package, 
  Globe, 
  Settings, 
  Terminal, 
  Code, 
  Database, 
  Layers 
} from "lucide-react";

interface WikiSidebarProps {
  repository: {
    name: string;
    owner: string;
    language?: string;
    stars?: string;
  };
  subsystems: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  pages: Array<{
    id: string;
    title: string;
    subsystem: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  currentPageId?: string;
  onPageSelect: (pageId: string) => void;
}

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


export function WikiSidebar({
  repository,
  subsystems,
  pages,
  currentPageId,
  onPageSelect,
}: WikiSidebarProps) {
  const groupedPages = pages.reduce((acc, page) => {
    const subsystemId = page.subsystem.id;
    if (!acc[subsystemId]) {
      acc[subsystemId] = [];
    }
    acc[subsystemId].push(page);
    return acc;
  }, {} as Record<string, typeof pages>);

  // Group subsystems by type for better organization
  const groupedSubsystems = subsystems.reduce((acc, subsystem) => {
    const type = subsystem.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(subsystem);
    return acc;
  }, {} as Record<string, typeof subsystems>);

  const typeOrder = ["core", "feature", "service", "api", "cli", "utility", "data"];
  const sortedTypes = Object.keys(groupedSubsystems).sort((a, b) => {
    const aIndex = typeOrder.indexOf(a);
    const bIndex = typeOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="flex h-full flex-col w-full overflow-hidden">
      {/* Repository Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="space-y-2">
          <h2 className="font-semibold text-lg break-words leading-tight">
            {repository.owner}/{repository.name}
          </h2>
          {(repository.language || repository.stars) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {repository.language && (
                <Badge variant="secondary" className="text-xs">
                  {repository.language}
                </Badge>
              )}
              {repository.stars && <span>⭐ {repository.stars}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Overview */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-left px-2 py-2",
              !currentPageId && "bg-muted"
            )}
            onClick={() => onPageSelect("")}>
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="text-sm">Overview</span>
          </Button>

          {/* Grouped Subsystems */}
          {sortedTypes.map((type) => (
            <div key={type} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
                {type}s
              </div>
              
              {groupedSubsystems[type].map((subsystem) => {
                const subsystemPages = groupedPages[subsystem.id] || [];
                
                return (
                  <div key={subsystem.id} className="space-y-1">
                    {/* If there are pages, make the subsystem name clickable to go to the first page */}
                    {subsystemPages.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left px-2 py-2 h-auto",
                          currentPageId === subsystemPages[0].id && "bg-muted"
                        )}
                        onClick={() => onPageSelect(subsystemPages[0].id)}>
                        <div className="flex items-center gap-2 w-full">
                          <div className={cn("p-1 rounded", getTypeColor(subsystem.type))}>
                            {getTypeIcon(subsystem.type)}
                          </div>
                          <span className="text-sm font-medium break-words leading-tight flex-1">
                            {subsystem.name}
                          </span>
                        </div>
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-muted/20">
                        <div className={cn("p-1 rounded", getTypeColor(subsystem.type))}>
                          {getTypeIcon(subsystem.type)}
                        </div>
                        <span className="text-sm font-medium break-words leading-tight flex-1">
                          {subsystem.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
