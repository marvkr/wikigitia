import OpenAI from "openai";
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
  description: string | null;
  type: string;
  files: string[];
  entryPoints: string[];
  dependencies: string[];
  complexity: string | null;
}

export class WikiGenerator {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

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
    const relevantCode: { path: string; content: string; lines: number }[] = [];

    const filesToCheck = [
      ...subsystem.entryPoints,
      ...subsystem.files.slice(0, 5), // Limit to first 5 files to avoid token limits
    ]
      .filter((file, index, arr) => arr.indexOf(file) === index) // Remove duplicates
      .filter((file) => {
        // Filter out invalid file paths
        if (!file || typeof file !== "string") return false;
        if (file.includes("*")) return false; // Skip wildcard patterns
        if (file.includes("..")) return false; // Skip relative paths with ..
        if (file.length > 500) return false; // Skip extremely long paths
        return true;
      });

    for (const filePath of filesToCheck) {
      try {
        const content = await GitHubService.getFileContent(
          owner,
          repo,
          filePath
        );
        const lines = content.split("\n").length;

        if (content.length < 10000) {
          // Limit file size
          relevantCode.push({
            path: filePath,
            content: content.slice(0, 5000), // Truncate very long files
            lines,
          });
        }
      } catch (error) {
        // Log warning but continue processing other files
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`Could not fetch content for ${filePath}:`, errorMessage);
        // Don't throw - just skip this file and continue
      }

      if (relevantCode.length >= 8) break; // Limit number of files
    }

    return relevantCode;
  }

  private static async generateContent(
    subsystem: Subsystem,
    relevantCode: { path: string; content: string; lines: number }[],
    owner: string,
    repo: string
  ): Promise<WikiContent> {
    const prompt = this.buildWikiPrompt(subsystem, relevantCode, owner, repo);

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a technical documentation expert creating comprehensive wiki pages for software subsystems.

Your task is to create clear, well-structured documentation that helps developers understand:
1. What this subsystem does and why it exists
2. How it fits into the larger architecture
3. Key interfaces and entry points
4. Important implementation details with code citations

Return a JSON response with this exact structure:
{
  "title": "Clear, descriptive title for the wiki page",
  "content": "Full markdown content with proper formatting, code blocks, and citation markers like [^1]",
  "citations": [
    {
      "text": "The specific code or concept being cited",
      "file": "path/to/file.ext",
      "startLine": 1,
      "endLine": 5,
      "url": "Generated GitHub URL",
      "context": "Brief explanation of what this code does"
    }
  ],
  "tableOfContents": [
    {
      "title": "Section Title",
      "anchor": "section-anchor",
      "level": 1
    }
  ]
}

Important guidelines:
- Use markdown formatting for readability
- Include code examples with syntax highlighting
- Create citations for specific code references using [^1], [^2], etc.
- Generate accurate GitHub URLs with line numbers
- Organize content with clear headings and sections
- Focus on practical information developers need`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(response) as WikiContent;

    // Generate GitHub URLs for citations
    parsed.citations = parsed.citations.map((citation) => ({
      ...citation,
      url: GitHubService.generateGitHubUrl(
        owner,
        repo,
        citation.file,
        citation.startLine,
        citation.endLine
      ),
    }));

    return parsed;
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
 * Exported function that tests expect
 * Generates a wiki page for a subsystem
 */
export async function generateWikiPage(
  subsystem: {
    id: string;
    name: string;
    description: string;
    type: string;
    files: string[];
    entryPoints: string[];
    dependencies: string[];
    complexity: string;
  },
  owner: string,
  repo: string
): Promise<WikiContent> {
  return WikiGenerator.generateWikiPage(subsystem, owner, repo);
}
