"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Globe, 
  Settings, 
  Terminal, 
  Code, 
  Database, 
  Layers, 
  BookOpen,
  ArrowRight,
  FileText,
  GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubsystemCardProps {
  subsystem: {
    id: string;
    name: string;
    description: string;
    type: string;
    files: string[];
    entryPoints: string[];
    dependencies: string[];
    complexity: string;
  };
  page?: {
    id: string;
    title: string;
  };
  onViewDetails?: () => void;
  className?: string;
}

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

export function SubsystemCard({ 
  subsystem, 
  page, 
  onViewDetails,
  className 
}: SubsystemCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg border",
              getTypeColor(subsystem.type)
            )}>
              {getTypeIcon(subsystem.type)}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">{subsystem.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getTypeColor(subsystem.type))}
                >
                  {subsystem.type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getComplexityColor(subsystem.complexity))}
                >
                  {subsystem.complexity} complexity
                </Badge>
              </div>
            </div>
          </div>
          
          {onViewDetails && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onViewDetails}
              className="flex items-center gap-1"
            >
              View Details
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <CardDescription className="text-sm leading-relaxed">
          {subsystem.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{subsystem.files.length}</p>
            <p className="text-xs text-muted-foreground">Files</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <ArrowRight className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{subsystem.entryPoints.length}</p>
            <p className="text-xs text-muted-foreground">Entry Points</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <GitBranch className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{subsystem.dependencies.length}</p>
            <p className="text-xs text-muted-foreground">Dependencies</p>
          </div>
        </div>

        {/* Key Files Preview */}
        {subsystem.files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Key Files</h4>
            <div className="space-y-1">
              {subsystem.files.slice(0, 3).map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  <span className="text-muted-foreground font-mono truncate">
                    {file}
                  </span>
                </div>
              ))}
              {subsystem.files.length > 3 && (
                <p className="text-xs text-muted-foreground pl-3">
                  +{subsystem.files.length - 3} more files
                </p>
              )}
            </div>
          </div>
        )}

        {/* Entry Points Preview */}
        {subsystem.entryPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Entry Points</h4>
            <div className="flex flex-wrap gap-1">
              {subsystem.entryPoints.slice(0, 3).map((entryPoint, index) => (
                <Badge key={index} variant="outline" className="text-xs font-mono">
                  {entryPoint}
                </Badge>
              ))}
              {subsystem.entryPoints.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{subsystem.entryPoints.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Wiki Page Info */}
        {page && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Wiki Page:</span>
              <span className="font-medium">{page.title}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}