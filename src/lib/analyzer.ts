import OpenAI from "openai";
import { GitHubService } from "./github";
import { nanoid } from "nanoid";

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

// Type matching what tests expect
export interface RepositoryAnalysis {
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
    type:
      | "feature"
      | "service"
      | "utility"
      | "cli"
      | "api"
      | "data"
      | "auth"
      | "core";
    files: string[];
    entryPoints: string[];
    dependencies: string[];
    publicInterfaces?: string[];
    technicalPerspective: string;
    featurePerspective: string;
  }>;
  metadata: {
    analyzedAt: string;
    totalFiles: number;
    analysisVersion: string;
    complexity: "low" | "medium" | "high";
  };
}

interface FileStructure {
  path: string;
  type: "file" | "dir";
  content?: string;
  size?: number;
}

export class AIAnalyzer {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

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

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert software architect analyzing GitHub repositories. Your task is to identify high-level subsystems that balance both feature-driven and technical perspectives. Focus on key features, user services, authentication flows, data layers, CLI tools, and core architectural components.

            Return a JSON response with this exact structure:
            {
              "summary": "Brief overview of the repository's purpose and architecture",
              "subsystems": [
                {
                  "name": "Subsystem Name",
                  "description": "Clear description of what this subsystem does",
                  "type": "feature|service|utility|infrastructure|cli|api|frontend|backend",
                  "files": ["list", "of", "relevant", "file", "paths"],
                  "entryPoints": ["main", "entry", "files"],
                  "dependencies": ["external", "dependencies"],
                  "complexity": "low|medium|high"
                }
              ]
            }`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      return JSON.parse(response) as InternalRepositoryAnalysis;
    } catch (error) {
      console.error("AI Analysis error:", error);
      throw new Error(`AI analysis failed: ${error}`);
    }
  }

  private static buildFileStructure(files: FileStructure[]): string {
    const directories = new Map<string, string[]>();

    files.forEach((file) => {
      const parts = file.path.split("/");
      const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      const filename = parts[parts.length - 1];

      if (!directories.has(dir)) {
        directories.set(dir, []);
      }
      directories.get(dir)!.push(filename);
    });

    let structure = "Repository File Structure:\n";
    const sortedDirs = Array.from(directories.keys()).sort();

    for (const dir of sortedDirs) {
      const dirName = dir || "(root)";
      structure += `\n${dirName}/\n`;
      const sortedFiles = directories.get(dir)!.sort();
      for (const file of sortedFiles) {
        structure += `  ${file}\n`;
      }
    }

    return structure;
  }

  private static async identifyKeyFiles(
    owner: string,
    repo: string,
    files: FileStructure[]
  ): Promise<string> {
    const keyFilePatterns = [
      "README.md",
      "package.json",
      "requirements.txt",
      "Cargo.toml",
      "main.py",
      "index.js",
      "index.ts",
      "app.py",
      "server.js",
      "config",
      "setup",
      "Dockerfile",
      "docker-compose",
    ];

    const keyFiles: { path: string; content: string }[] = [];

    for (const file of files.slice(0, 20)) {
      // Limit to first 20 files to avoid token limits
      const shouldInclude =
        keyFilePatterns.some((pattern) =>
          file.path.toLowerCase().includes(pattern.toLowerCase())
        ) || file.path.split("/").length <= 2; // Include root level files

      if (shouldInclude) {
        try {
          const content = await GitHubService.getFileContent(
            owner,
            repo,
            file.path
          );
          if (content.length < 5000) {
            // Limit content size
            keyFiles.push({ path: file.path, content: content.slice(0, 2000) });
          }
        } catch (error) {
          console.warn(`Could not fetch content for ${file.path}:`, error);
        }
      }

      if (keyFiles.length >= 10) break; // Limit number of files
    }

    let keyFilesContent = "Key File Contents:\n\n";
    for (const file of keyFiles) {
      keyFilesContent += `=== ${file.path} ===\n${file.content}\n\n`;
    }

    return keyFilesContent;
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

/**
 * Map internal subsystem types to test-expected types
 */
function mapSubsystemType(
  internalType:
    | "feature"
    | "service"
    | "utility"
    | "infrastructure"
    | "cli"
    | "api"
    | "frontend"
    | "backend"
):
  | "feature"
  | "service"
  | "utility"
  | "cli"
  | "api"
  | "data"
  | "auth"
  | "core" {
  const typeMap: Record<
    string,
    "feature" | "service" | "utility" | "cli" | "api" | "data" | "auth" | "core"
  > = {
    feature: "feature",
    service: "service",
    utility: "utility",
    infrastructure: "core",
    cli: "cli",
    api: "api",
    frontend: "feature",
    backend: "service",
  };

  return typeMap[internalType] || "core";
}

/**
 * Calculate overall complexity from individual subsystem complexities
 */
function calculateOverallComplexity(
  complexities: string[]
): "low" | "medium" | "high" {
  const counts = { low: 0, medium: 0, high: 0 };

  complexities.forEach((complexity) => {
    const normalized = complexity.toLowerCase();
    if (normalized in counts) {
      counts[normalized as keyof typeof counts]++;
    }
  });

  // If majority is high, return high
  if (counts.high > counts.medium + counts.low) return "high";
  // If majority is medium, return medium
  if (counts.medium > counts.low) return "medium";
  // Default to low
  return "low";
}
