import { generateText } from "ai";
import { GitHubService } from "./github";
import { nanoid } from "nanoid";
import { modelGPT41 } from "./llm-providers";

interface SubsystemAnalysis {
  name: string;
  description: string;
  type:
    | "feature"
    | "service"
    | "utility"
    | "infrastructure"
    | "cli"
    | "api"
    | "frontend"
    | "backend";
  files: string[];
  entryPoints: string[];
  dependencies: string[];
  complexity: string;
}

interface InternalRepositoryAnalysis {
  summary: string;
  subsystems: SubsystemAnalysis[];
}

interface FileStructure {
  path: string;
  type: "file" | "dir";
  size?: number;
}

interface RepositoryAnalysis {
  repository: {
    owner: string;
    name: string;
    url: string;
    description?: string;
    language: string;
    stars: number;
    lastUpdated: string;
  };
  subsystems: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    files: string[];
    entryPoints: string[];
    dependencies: string[];
    publicInterfaces: string[];
    technicalPerspective: string;
    featurePerspective: string;
  }>;
  metadata: {
    analyzedAt: string;
    totalFiles: number;
    analysisVersion: string;
    complexity: string;
  };
}

export class AIAnalyzer {
  static async analyzeRepository(
    owner: string,
    repo: string,
    files: FileStructure[]
  ): Promise<InternalRepositoryAnalysis> {
    try {
      const fileStructure = this.buildFileStructure(files);
      const keyFiles = await this.identifyKeyFiles(owner, repo, files);
      const prompt = this.buildAnalysisPrompt(
        owner,
        repo,
        fileStructure,
        keyFiles
      );

      const result = await generateText({
        model: modelGPT41,
        prompt: prompt,
        system: `You are an expert software architect analyzing GitHub repositories.

Analyze the repository structure and identify 3-8 main subsystems or components that would help a developer understand the codebase.

For each subsystem, provide:
- A clear, descriptive name
- What it does and why it's important
- The type (feature/service/utility/infrastructure/cli/api/frontend/backend)
- Key files that belong to it (ONLY list actual file paths from the repository, NOT descriptions)
- Main entry points (ONLY actual file paths, NOT descriptions)
- External dependencies it uses (library names, NOT file paths)
- Complexity assessment (low/medium/high)

IMPORTANT: When listing files and entry points, provide ONLY actual file paths that exist in the repository. Do NOT provide descriptions like "README.md in each subdirectory" or "Each subdirectory under the root". Use exact paths like "src/components/Button.tsx" or "docs/README.md".

Format your response as simple text, not JSON. Use this structure:

SUMMARY: [Brief overview of the repository]

SUBSYSTEM: [Name]
TYPE: [type]
DESCRIPTION: [what it does]
FILES: [file1, file2, file3]
ENTRY_POINTS: [main.js, index.ts]
DEPENDENCIES: [express, react]
COMPLEXITY: [low/medium/high]

SUBSYSTEM: [Next subsystem...]
...

Focus on subsystems that would be meaningful to a developer trying to understand the codebase. Aim for 3-8 subsystems total.`,
        temperature: 0.3,
      });

      // Parse the natural language response
      return this.parseAnalysisResponse(result.text, files);
    } catch (error) {
      console.error("AI analysis failed:", error);
      throw new Error(`AI analysis failed: ${error}`);
    }
  }

  private static buildFileStructure(files: FileStructure[]): string {
    const tree = files
      .filter((f) => f.type === "file")
      .slice(0, 100) // Limit to first 100 files to avoid token limits
      .map((f) => `${f.path} (${f.size || 0} bytes)`)
      .join("\n");

    return `File structure (${files.length} total files):\n${tree}`;
  }

  private static async identifyKeyFiles(
    owner: string,
    repo: string,
    files: FileStructure[]
  ): Promise<string> {
    const keyFilePatterns = [
      /package\.json$/,
      /requirements\.txt$/,
      /Cargo\.toml$/,
      /go\.mod$/,
      /pom\.xml$/,
      /README\.md$/i,
      /index\.(js|ts|py|html)$/,
      /main\.(js|ts|py|go|rs)$/,
      /app\.(js|ts|py)$/,
      /server\.(js|ts|py)$/,
      /config\.(js|ts|json|yaml|yml)$/,
    ];

    const keyFiles = files.filter((file) =>
      keyFilePatterns.some((pattern) => pattern.test(file.path))
    );

    if (keyFiles.length === 0) {
      return "No key configuration files found.";
    }

    const fileContents = await Promise.all(
      keyFiles.slice(0, 5).map(async (file) => {
        try {
          const content = await GitHubService.getFileContent(
            owner,
            repo,
            file.path
          );
          return `=== ${file.path} ===\n${content.slice(0, 1000)}${
            content.length > 1000 ? "\n... (truncated)" : ""
          }\n`;
        } catch (error) {
          return `=== ${file.path} ===\n(Could not fetch content)\n`;
        }
      })
    );

    return `Key files content:\n${fileContents.join("\n")}`;
  }

  private static buildAnalysisPrompt(
    owner: string,
    repo: string,
    fileStructure: string,
    keyFiles: string
  ): string {
    return `Please analyze this GitHub repository: ${owner}/${repo}

${fileStructure}

${keyFiles}

Based on the file structure and key file contents, identify the main subsystems of this repository. Think about:

1. **Feature-driven components**: What are the main features users interact with?
2. **Technical architecture**: How is the code organized? (frontend, backend, API, database, etc.)
3. **Infrastructure**: Build systems, deployment, configuration
4. **Utilities**: Shared libraries, helpers, tools
5. **Entry points**: Main files that start the application or provide interfaces

For each subsystem, provide:
- A clear, descriptive name
- What it does and why it's important
- The type (feature/service/utility/infrastructure/cli/api/frontend/backend)
- Key files that belong to it
- Main entry points
- External dependencies it uses
- Complexity assessment

Focus on subsystems that would be meaningful to a developer trying to understand the codebase. Aim for 3-8 subsystems total.`;
  }

  private static parseAnalysisResponse(
    response: string,
    files: FileStructure[]
  ): InternalRepositoryAnalysis {
    const lines = response.split("\n");
    let summary = "";
    const subsystems: SubsystemAnalysis[] = [];
    let currentSubsystem: Partial<SubsystemAnalysis> | null = null;

    // Create a set of valid file paths for quick lookup
    const validFilePaths = new Set(files.map((f) => f.path));

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("SUMMARY:")) {
        summary = trimmed.replace("SUMMARY:", "").trim();
      } else if (trimmed.startsWith("SUBSYSTEM:")) {
        if (currentSubsystem && currentSubsystem.name) {
          subsystems.push(currentSubsystem as SubsystemAnalysis);
        }
        currentSubsystem = {
          name: trimmed.replace("SUBSYSTEM:", "").trim(),
          files: [],
          entryPoints: [],
          dependencies: [],
        };
      } else if (currentSubsystem) {
        if (trimmed.startsWith("TYPE:")) {
          const type = trimmed.replace("TYPE:", "").trim().toLowerCase();
          currentSubsystem.type = this.normalizeType(type);
        } else if (trimmed.startsWith("DESCRIPTION:")) {
          currentSubsystem.description = trimmed
            .replace("DESCRIPTION:", "")
            .trim();
        } else if (trimmed.startsWith("FILES:")) {
          const filesStr = trimmed.replace("FILES:", "").trim();
          currentSubsystem.files = this.parseList(filesStr, validFilePaths);
        } else if (trimmed.startsWith("ENTRY_POINTS:")) {
          const entryPointsStr = trimmed.replace("ENTRY_POINTS:", "").trim();
          currentSubsystem.entryPoints = this.parseList(
            entryPointsStr,
            validFilePaths
          );
        } else if (trimmed.startsWith("DEPENDENCIES:")) {
          const depsStr = trimmed.replace("DEPENDENCIES:", "").trim();
          currentSubsystem.dependencies = this.parseList(depsStr);
        } else if (trimmed.startsWith("COMPLEXITY:")) {
          const complexity = trimmed
            .replace("COMPLEXITY:", "")
            .trim()
            .toLowerCase();
          currentSubsystem.complexity = this.normalizeComplexity(complexity);
        }
      }
    }

    // Add the last subsystem
    if (currentSubsystem && currentSubsystem.name) {
      subsystems.push(currentSubsystem as SubsystemAnalysis);
    }

    // Fallback if no subsystems were parsed
    if (subsystems.length === 0) {
      return {
        summary: summary || "Repository analysis completed",
        subsystems: this.createFallbackSubsystems(),
      };
    }

    return {
      summary: summary || "Repository analysis completed",
      subsystems,
    };
  }

  private static completeSubsystem(
    partial: Partial<SubsystemAnalysis>
  ): SubsystemAnalysis {
    return {
      name: partial.name || "Unknown Component",
      description: partial.description || "Component description not available",
      type: partial.type || "utility",
      files: partial.files || [],
      entryPoints: partial.entryPoints || [],
      dependencies: partial.dependencies || [],
      complexity: partial.complexity || "medium",
    };
  }

  private static normalizeType(type: string): SubsystemAnalysis["type"] {
    const typeMap: Record<string, SubsystemAnalysis["type"]> = {
      feature: "feature",
      service: "service",
      utility: "utility",
      infrastructure: "infrastructure",
      cli: "cli",
      api: "api",
      frontend: "frontend",
      backend: "backend",
    };
    return typeMap[type] || "utility";
  }

  private static normalizeComplexity(complexity: string): string {
    if (complexity.includes("low")) return "low";
    if (complexity.includes("high")) return "high";
    return "medium";
  }

  private static parseList(
    str: string,
    validFilePaths?: Set<string>
  ): string[] {
    if (!str || str === "none" || str === "n/a") return [];

    const items = str
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter((item) => item && item !== "none" && item !== "n/a");

    // Filter out invalid file paths - keep only items that look like actual file paths
    const filteredItems = items.filter((item) => {
      // Skip items that are clearly descriptions or explanations
      if (item.includes(" ") && !item.includes("/")) return false;
      if (item.includes("(") || item.includes(")")) return false;
      if (item.includes("each") || item.includes("specific")) return false;
      if (item.includes("subdirectory") || item.includes("directory"))
        return false;
      if (item.length > 100) return false; // Very long strings are likely descriptions
      if (item.includes("e.g.") || item.includes("such as")) return false;

      // For dependencies (no validFilePaths provided), keep library names
      if (!validFilePaths) {
        // Keep items that look like library names (no slashes, may have dots)
        return !item.includes("/");
      }

      // For file paths, validate against actual repository structure
      if (validFilePaths.has(item)) {
        return true;
      }

      // Keep items that look like file paths but warn about missing files
      if (item.includes("/") || item.includes(".")) {
        console.warn(`AI suggested file path that doesn't exist: ${item}`);
        return false;
      }

      // Skip everything else that doesn't look like a file path
      return false;
    });

    return filteredItems;
  }

  private static createFallbackSubsystems(): SubsystemAnalysis[] {
    return [
      {
        name: "Core Application",
        description: "Main application logic and components",
        type: "feature",
        files: [],
        entryPoints: [],
        dependencies: [],
        complexity: "medium",
      },
    ];
  }
}

// Helper functions for type mapping and complexity calculation
function mapSubsystemType(type: string): string {
  const typeMap: Record<string, string> = {
    feature: "Feature",
    service: "Service",
    utility: "Utility",
    infrastructure: "Infrastructure",
    cli: "CLI Tool",
    api: "API",
    frontend: "Frontend",
    backend: "Backend",
  };
  return typeMap[type] || "Component";
}

function calculateOverallComplexity(complexities: string[]): string {
  const complexityScores = complexities.map((c) => {
    switch (c) {
      case "low":
        return 1;
      case "medium":
        return 2;
      case "high":
        return 3;
      default:
        return 2;
    }
  });

  const avgScore =
    complexityScores.reduce((sum, score) => sum + score, 0) /
    complexityScores.length;

  if (avgScore <= 1.5) return "low";
  if (avgScore <= 2.5) return "medium";
  return "high";
}

/**
 * Main exported function that tests expect
 * Combines GitHub API calls with AI analysis to produce the expected format
 */
export async function analyzeRepository(
  owner: string,
  repo: string
): Promise<RepositoryAnalysis> {
  try {
    // Fetch repository metadata
    const repoInfo = await GitHubService.getRepositoryInfo(owner, repo);

    // Fetch file structure
    const files = await GitHubService.getAllFiles(owner, repo);

    // Run AI analysis
    const analysis = await AIAnalyzer.analyzeRepository(owner, repo, files);

    // Map internal types to expected test format
    const subsystems = analysis.subsystems.map((subsystem) => ({
      id: nanoid(),
      name: subsystem.name,
      description: subsystem.description,
      type: mapSubsystemType(subsystem.type),
      files: subsystem.files,
      entryPoints: subsystem.entryPoints,
      dependencies: subsystem.dependencies,
      publicInterfaces: subsystem.entryPoints, // Use entry points as public interfaces
      technicalPerspective: `Technical component of type ${subsystem.type} with ${subsystem.complexity} complexity`,
      featurePerspective: `User-facing feature: ${subsystem.description}`,
    }));

    // Calculate overall complexity
    const complexities = analysis.subsystems.map((s) => s.complexity);
    const overallComplexity = calculateOverallComplexity(complexities);

    return {
      repository: {
        owner,
        name: repo,
        url: `https://github.com/${owner}/${repo}`,
        description: repoInfo.description || undefined,
        language: repoInfo.language || "Unknown",
        stars: repoInfo.stargazers_count || 0,
        lastUpdated: repoInfo.updated_at || new Date().toISOString(),
      },
      subsystems,
      metadata: {
        analyzedAt: new Date().toISOString(),
        totalFiles: files.length,
        analysisVersion: "1.0.0",
        complexity: overallComplexity,
      },
    };
  } catch (error) {
    console.error("Repository analysis failed:", error);
    throw new Error(`Failed to analyze repository ${owner}/${repo}: ${error}`);
  }
}
