import { generateObject } from "ai";
import { z } from "zod";
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

// Zod schema for AI response validation
const SubsystemSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum([
    "feature",
    "service",
    "utility",
    "infrastructure",
    "cli",
    "api",
    "frontend",
    "backend",
  ]),
  files: z.array(z.string()),
  entryPoints: z.array(z.string()),
  dependencies: z.array(z.string()),
  complexity: z.enum(["low", "medium", "high"]),
});

const AnalysisSchema = z.object({
  summary: z.string(),
  subsystems: z.array(SubsystemSchema),
});

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

      const result = await generateObject({
        model: modelGPT41,
        schema: AnalysisSchema,
        messages: [
          {
            role: "system",
            content: `You are an expert software architect analyzing GitHub repositories. Your task is to identify high-level subsystems that balance both feature-driven and technical perspectives. Focus on key features, user services, authentication flows, data layers, CLI tools, and core architectural components.

Analyze the repository structure and identify 3-8 meaningful subsystems that would help a developer understand the codebase. Each subsystem should represent either:
1. A major feature or user-facing capability
2. A technical component or service layer
3. Infrastructure or tooling that supports the application
4. A distinct architectural layer (frontend, backend, API, etc.)

For each subsystem, provide:
- A clear, descriptive name
- What it does and why it's important
- The appropriate type classification
- Key files that belong to it (be selective, include the most important ones)
- Main entry points (files that serve as interfaces or starting points)
- External dependencies it relies on
- Complexity assessment based on code structure and responsibilities`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const { object } = result;

      return object as InternalRepositoryAnalysis;
    } catch (error) {
      console.error("AI Analysis error:", error);
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
