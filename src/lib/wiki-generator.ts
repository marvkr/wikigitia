import { generateObject } from "ai";
import { z } from "zod";
import { GitHubService } from "./github";
import { Citation, TableOfContentsItem } from "@/db/schema";
import { modelGPT41 } from "./llm-providers";

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
  ): Promise<{ path: string; content: string; lines: number; summary: string }[]> {
    const relevantFiles: { path: string; content: string; lines: number; summary: string }[] =
      [];

    // Process subsystem files (limit to 15 most important for deeper analysis)
    const filesToProcess = subsystem.files.slice(0, 15);

    for (const filePath of filesToProcess) {
      try {
        const content = await GitHubService.getFileContent(
          owner,
          repo,
          filePath
        );
        const lines = content.split("\n").length;

        // Skip very large files or binary files
        if (lines > 2000 || content.length > 100000) {
          console.log(`Skipping large file: ${filePath} (${lines} lines)`);
          continue;
        }

        // Extract meaningful summary based on file type and content
        const summary = this.extractFileSummary(filePath, content);

        relevantFiles.push({
          path: filePath,
          content: content.slice(0, 8000), // Increased content limit for more context
          lines,
          summary,
        });
      } catch (error) {
        console.warn(`Could not fetch content for ${filePath}:`, error);
        // Continue with other files even if one fails
      }
    }

    return relevantFiles;
  }

  private static extractFileSummary(filePath: string, content: string): string {
    const fileName = filePath.split('/').pop() || filePath;
    const extension = fileName.split('.').pop();
    const firstLines = content.split('\n').slice(0, 20).join('\n');
    
    // Extract key information based on file type
    if (extension === 'md' || extension === 'txt') {
      return `Documentation file: ${fileName}`;
    }
    
    if (extension === 'json' && fileName.includes('package')) {
      return 'Package configuration and dependencies';
    }
    
    if (extension === 'json') {
      return `Configuration file: ${fileName}`;
    }
    
    // For code files, try to extract classes, functions, exports
    const patterns = {
      classes: /class\s+([A-Z][a-zA-Z0-9_]*)/g,
      functions: /(?:function|def|fn)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      exports: /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      imports: /import.+from\s+['"]([^'"]+)['"]/g,
    };
    
    const extracted = {
      classes: [...firstLines.matchAll(patterns.classes)].map(m => m[1]),
      functions: [...firstLines.matchAll(patterns.functions)].map(m => m[1]),
      exports: [...firstLines.matchAll(patterns.exports)].map(m => m[1]),
      imports: [...firstLines.matchAll(patterns.imports)].map(m => m[1]),
    };
    
    const summary = [];
    if (extracted.classes.length > 0) summary.push(`Classes: ${extracted.classes.slice(0, 3).join(', ')}`);
    if (extracted.functions.length > 0) summary.push(`Functions: ${extracted.functions.slice(0, 3).join(', ')}`);
    if (extracted.exports.length > 0) summary.push(`Exports: ${extracted.exports.slice(0, 3).join(', ')}`);
    
    return summary.length > 0 ? summary.join(' | ') : `Source file: ${fileName}`;
  }

  private static async generateContent(
    subsystem: Subsystem,
    relevantCode: { path: string; content: string; lines: number; summary: string }[],
    owner: string,
    repo: string
  ): Promise<WikiContent> {
    const prompt = this.buildWikiPrompt(subsystem, relevantCode, owner, repo);

    const result = await generateObject({
      model: modelGPT41,
      schema: WikiContentSchema,
      messages: [
        {
          role: "system",
          content: `You are a senior technical documentation expert and software architect creating comprehensive, in-depth wiki pages for complex software subsystems.

Your task is to create detailed, thorough documentation that serves as the definitive reference for developers. Focus on:

1. **Deep Technical Analysis**: Provide detailed technical insights, not just surface-level descriptions
2. **Architectural Context**: Explain how components fit into the broader system architecture
3. **Implementation Details**: Cover design patterns, algorithms, performance characteristics
4. **Practical Guidance**: Include actionable information for development, debugging, and extension
5. **Code Quality Insights**: Analyze code quality, patterns, and improvement opportunities

Create comprehensive documentation with:
- A clear, descriptive title that reflects the subsystem's core purpose
- Well-structured markdown with logical flow and clear hierarchy
- Detailed code examples with thorough explanations
- In-depth analysis of implementation patterns and architectural decisions
- Citations for specific code references with context and significance
- Accurate line number estimates based on content analysis
- Performance and scalability considerations
- Security implications where relevant
- Maintenance and evolution guidance

Documentation Standards:
- Use precise technical language appropriate for senior developers
- Include both high-level concepts and implementation details
- Provide multiple perspectives: architectural, implementation, operational
- Cover edge cases, error handling, and failure scenarios
- Explain not just "what" but "why" and "how"
- Include recommendations for improvements and best practices
- Make it comprehensive enough for complex debugging and feature development

Target Audience: Senior developers, architects, and technical leads who need deep understanding for:
- Complex debugging and troubleshooting
- System architecture decisions
- Feature development and extension
- Performance optimization
- Code review and refactoring
- Technical design discussions`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const { object } = result;

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
    relevantCode: { path: string; content: string; lines: number; summary: string }[],
    owner: string,
    repo: string
  ): string {
    const codeSection = relevantCode
      .map(
        (file) =>
          `=== ${file.path} (${file.lines} lines) ===\n**Summary:** ${file.summary}\n\n${file.content}\n\n`
      )
      .join("");

    return `Create comprehensive, in-depth technical documentation for this subsystem from the ${owner}/${repo} repository:

**Subsystem Information:**
- Name: ${subsystem.name}
- Description: ${subsystem.description || "No description provided"}
- Type: ${subsystem.type}
- Complexity: ${subsystem.complexity || "Unknown"}
- Entry Points: ${subsystem.entryPoints.join(", ") || "None specified"}
- Dependencies: ${subsystem.dependencies.join(", ") || "None specified"}
- Associated Files (${subsystem.files.length} total): ${subsystem.files.slice(0, 15).join(", ")}

**Relevant Code Files with Analysis:**
${codeSection}

Please create a comprehensive, detailed wiki page that includes:

1. **Overview & Purpose**
   - What this subsystem does and why it exists
   - Its role in the overall system architecture
   - Key responsibilities and boundaries
   - Business value and use cases

2. **Architecture & Design**
   - High-level architectural patterns used
   - Design principles and decisions
   - Key abstractions and interfaces
   - Data flow and control flow
   - Performance characteristics

3. **Key Components & Implementation**
   - Main classes, functions, modules with detailed explanations
   - Core algorithms and business logic
   - State management approach
   - Error handling strategies
   - Security considerations

4. **APIs & Entry Points**
   - Public interfaces and how to use them
   - Input/output specifications
   - Usage patterns and examples
   - Integration points with other subsystems

5. **Dependencies & Relationships**
   - External library dependencies and why they're used
   - Internal dependencies and coupling analysis
   - Database interactions and data models
   - Network interactions and protocols

6. **Configuration & Environment**
   - Configuration options and environment variables
   - Deployment considerations
   - Runtime requirements
   - Monitoring and observability

7. **Code Examples & Patterns**
   - Detailed usage examples with explanations
   - Common patterns and best practices
   - Integration examples
   - Testing approaches

8. **Performance & Scalability**
   - Performance characteristics and bottlenecks
   - Scalability considerations
   - Resource usage patterns
   - Optimization opportunities

9. **Maintenance & Evolution**
   - Code quality metrics
   - Technical debt areas
   - Future enhancement opportunities
   - Known limitations and trade-offs

For each significant code reference, create detailed citations with:
- The exact file path
- Accurate line numbers (estimate based on content position and context)
- Detailed explanation of what the code does
- Architectural significance and rationale
- Related patterns or similar implementations
- Potential improvement areas

Make this documentation comprehensive enough that a new developer could:
- Understand the subsystem's purpose and design
- Make meaningful contributions
- Debug issues effectively
- Extend functionality properly

Use clear markdown formatting with code blocks, headers, and proper structure.`;
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
