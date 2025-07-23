"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

export function CodeBlock({
  code,
  language,
  filename,
  className,
  showLineNumbers = true,
  highlightLines = [],
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const lines = code.split('\n');

  const getLanguageDisplayName = (lang?: string) => {
    if (!lang) return 'Text';
    
    const langMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'py': 'Python',
      'rs': 'Rust',
      'go': 'Go',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'php': 'PHP',
      'rb': 'Ruby',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'cs': 'C#',
      'scala': 'Scala',
      'clj': 'Clojure',
      'hs': 'Haskell',
      'ml': 'OCaml',
      'elm': 'Elm',
      'dart': 'Dart',
      'lua': 'Lua',
      'r': 'R',
      'sh': 'Shell',
      'bash': 'Bash',
      'zsh': 'Zsh',
      'fish': 'Fish',
      'ps1': 'PowerShell',
      'sql': 'SQL',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'toml': 'TOML',
      'ini': 'INI',
      'cfg': 'Config',
      'conf': 'Config',
      'md': 'Markdown',
      'mdx': 'MDX',
      'txt': 'Text',
      'log': 'Log',
      'env': 'Environment'
    };
    
    return langMap[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
      {/* Header */}
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-medium text-foreground">
                {filename}
              </span>
            )}
            {language && (
              <Badge variant="secondary" className="text-xs">
                {getLanguageDisplayName(language)}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Code Content */}
      <div className="overflow-auto">
        <pre className="p-4 text-sm">
          <code className="text-foreground">
            {showLineNumbers ? (
              <table className="w-full">
                <tbody>
                  {lines.map((line, index) => {
                    const lineNumber = index + 1;
                    const isHighlighted = highlightLines.includes(lineNumber);
                    
                    return (
                      <tr 
                        key={index}
                        className={cn(
                          "group",
                          isHighlighted && "bg-yellow-500/10"
                        )}
                      >
                        <td className="pr-4 text-right text-muted-foreground select-none w-12">
                          <span className="text-xs">{lineNumber}</span>
                        </td>
                        <td className="text-left">
                          <span className={cn(
                            isHighlighted && "bg-yellow-500/20 px-1 rounded"
                          )}>
                            {line || ' '}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>

      {/* Copy button for blocks without header */}
      {!filename && !language && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}