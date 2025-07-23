"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface Citation {
  text: string;
  file: string;
  startLine: number;
  endLine: number;
  url: string;
  context: string;
}

interface CitationLinkProps {
  citation: Citation;
  className?: string;
  variant?: "inline" | "block";
}

export function CitationLink({
  citation,
  className,
  variant = "inline",
}: CitationLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const getLanguageFromExtension = (ext: string) => {
    const langMap: Record<string, string> = {
      js: "JavaScript",
      ts: "TypeScript",
      jsx: "React JSX",
      tsx: "React TSX",
      py: "Python",
      rs: "Rust",
      go: "Go",
      java: "Java",
      cpp: "C++",
      c: "C",
      php: "PHP",
      rb: "Ruby",
      swift: "Swift",
      kt: "Kotlin",
      cs: "C#",
      scala: "Scala",
      clj: "Clojure",
      hs: "Haskell",
      ml: "OCaml",
      elm: "Elm",
      dart: "Dart",
      lua: "Lua",
      r: "R",
      sh: "Shell",
      bash: "Bash",
      zsh: "Zsh",
      fish: "Fish",
      ps1: "PowerShell",
      sql: "SQL",
      html: "HTML",
      css: "CSS",
      scss: "SCSS",
      sass: "Sass",
      less: "Less",
      json: "JSON",
      xml: "XML",
      yaml: "YAML",
      yml: "YAML",
      toml: "TOML",
      ini: "INI",
      cfg: "Config",
      conf: "Config",
      md: "Markdown",
      mdx: "MDX",
      txt: "Text",
      log: "Log",
      env: "Environment",
    };
    return langMap[ext] || ext.toUpperCase();
  };

  const formatLineRange = () => {
    if (citation.startLine === citation.endLine) {
      return `Line ${citation.startLine}`;
    }
    return `Lines ${citation.startLine}-${citation.endLine}`;
  };

  if (variant === "inline") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="link"
            size="sm"
            className={cn(
              "h-auto p-0 text-primary underline underline-offset-2 hover:text-primary/80",
              className
            )}>
            {citation.text}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {citation.file}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge variant="secondary">
                {getLanguageFromExtension(getFileExtension(citation.file))}
              </Badge>
              <span>{formatLineRange()}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              <code>{citation.context}</code>
            </pre>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                View the complete file on GitHub
              </p>
              <Button asChild size="sm">
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2">
                  Open in GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Block variant for more detailed display
  return (
    <div className={cn("border rounded-lg p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">{citation.file}</h4>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {getLanguageFromExtension(getFileExtension(citation.file))}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatLineRange()}
            </span>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            View
          </a>
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">"{citation.text}"</p>
        <pre className="bg-muted p-3 rounded text-xs overflow-auto">
          <code>{citation.context}</code>
        </pre>
      </div>
    </div>
  );
}
