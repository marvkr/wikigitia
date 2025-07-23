import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { GitHubService } from "./github";
import { Citation, TableOfContentsItem } from "@/db/schema";

interface WikiContent {
  title: string;
  content: string;
  citations: Citation[];
  tableOfContents: TableOfContentsItem[];
}

interface Subsystem {
  id: string;
  name: string;
  description: string;
  type: string;
  files: string[];
  entryPoints: string[];
  dependencies: string[];
  complexity: string;
}

// Zod schemas for AI response validation
const CitationSchema = z.object({
  text: z.string(),
  file: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  url: z.string().optional(),
  context: z.string(),
});

const TableOfContentsSchema = z.object({
  title: z.string(),
  anchor: z.string(),
  level: z.number(),
});

const WikiContentSchema = z.object({
  title: z.string(),
  content: z.string(),
  citations: z.array(CitationSchema),
  tableOfContents: z.array(TableOfContentsSchema),
});

export class WikiGenerator {
  static async generateWikiPage(
    subsystem: Subsystem,
    owner: string,
    repo: string
  ): Promise<WikiContent> {
    try {
      console.log(`Starting wiki generation for subsystem: ${subsystem.name}`);

      const relevantCode = await this.gatherRelevantCode(
        subsystem,
        owner,
        repo
      );

      console.log(
        `Found ${relevantCode.length} relevant files for ${subsystem.name}`
      );

      const wikiContent = await this.generateContent(
        subsystem,
        relevantCode,
        owner,
        repo
      );

      console.log(`Successfully generated wiki content for ${subsystem.name}`);
      return wikiContent;
    } catch (error) {
      console.error("Wiki generation error:", error);
      throw new Error(`Failed to generate wiki page: ${error}`);
    }
  }

  private static async gatherRelevantCode(
    subsystem: Subsystem,
    owner: string,
    repo: string
  ): Promise<{ path: string; content: string; lines: number }[]> {
    const relevantFiles: { path: string; content: string; lines: number }[] =
      [];

    // Process subsystem files (limit to 10 most important)
    const filesToProcess = subsystem.files.slice(0, 10);

    for (const filePath of filesToProcess) {
      try {
        const content = await GitHubService.getFileContent(
          owner,
          repo,
          filePath
        );
        const lines = content.split("\n").length;

        // Skip very large files or binary files
        if (lines > 1000 || content.length > 50000) {
          console.log(`Skipping large file: ${filePath} (${lines} lines)`);
          continue;
        }

        relevantFiles.push({
          path: filePath,
          content: content.slice(0, 5000), // Limit content to avoid token limits
          lines,
        });
      } catch (error) {
        console.warn(`Could not fetch content for ${filePath}:`, error);
        // Continue with other files even if one fails
      }
    }

    return relevantFiles;
  }

  private static async generateContent(
    subsystem: Subsystem,
    relevantCode: { path: string; content: string; lines: number }[],
    owner: string,
    repo: string
  ): Promise<WikiContent> {
    const prompt = this.buildWikiPrompt(subsystem, relevantCode, owner, repo);

    const { object } = await generateObject({
      model: openai("gpt-4-turbo-2024-04-09"), // GPT-4.1
      schema: WikiContentSchema,
      system: `You are a technical documentation expert creating comprehensive wiki pages for software subsystems.

Your task is to create clear, well-structured documentation that helps developers understand:
1. What this subsystem does and why it exists
2. How it fits into the larger architecture
3. Key interfaces and entry points
4. Important implementation details with code citations

Create comprehensive documentation with:
- A clear, descriptive title
- Well-structured markdown content with proper formatting
- Code examples with syntax highlighting
- Citations for specific code references using [^1], [^2], etc.
- Accurate line number estimates for citations
- A logical table of contents with proper anchors
- Focus on practical information developers need

Guidelines:
- Use markdown formatting for readability
- Include code examples where relevant
- Create citations for important code references
- Generate realistic line numbers based on content position
- Organize content with clear headings and sections
- Make it useful for developers new to the codebase`,
      prompt,
      temperature: 0.3,
    });

    const wikiContent = object as WikiContent;

    // Generate GitHub URLs for citations
    wikiContent.citations = wikiContent.citations.map((citation) => ({
      ...citation,
      url: GitHubService.generateGitHubUrl(
        owner,
        repo,
        citation.file,
        citation.startLine,
        citation.endLine
      ),
    }));

    return wikiContent;
  }

  private static buildWikiPrompt(
    subsystem: Subsystem,
    relevantCode: { path: string; content: string; lines: number }[],
    owner: string,
    repo: string
  ): string {
    const codeSection = relevantCode
      .map(
        (file) =>
          `=== ${file.path} (${file.lines} lines) ===\n${file.content}\n\n`
      )
      .join("");

    return `Create comprehensive documentation for this subsystem from the ${owner}/${repo} repository:

**Subsystem Information:**
- Name: ${subsystem.name}
- Description: ${subsystem.description || "No description provided"}
- Type: ${subsystem.type}
- Complexity: ${subsystem.complexity || "Unknown"}
- Entry Points: ${subsystem.entryPoints.join(", ") || "None specified"}
- Dependencies: ${subsystem.dependencies.join(", ") || "None specified"}
- Associated Files: ${subsystem.files.slice(0, 10).join(", ")}

**Relevant Code Files:**
${codeSection}

Please create a comprehensive wiki page that includes:

1. **Overview**: What this subsystem does and its role in the overall architecture
2. **Key Components**: Main classes, functions, or modules and their purposes
3. **Entry Points**: How to interact with or use this subsystem
4. **Implementation Details**: Important architectural decisions and patterns
5. **Dependencies**: External libraries and internal dependencies
6. **Usage Examples**: Code examples showing how this subsystem is used
7. **Configuration**: Any configuration options or environment variables

For each significant code reference, create a citation with:
- The exact file path
- Line numbers (estimate based on content position)
- Brief explanation of what the code does
- Context about why it's important

Organize the content with clear sections and use markdown formatting. Make it useful for developers who are new to the codebase.`;
  }
}

/**
 * Main exported function for generating wiki pages
 */
export async function generateWikiPage(
  subsystem: Subsystem,
  owner: string,
  repo: string
): Promise<WikiContent> {
  return WikiGenerator.generateWikiPage(subsystem, owner, repo);
}
