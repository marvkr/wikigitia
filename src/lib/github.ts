import { Octokit } from "@octokit/rest";

interface RepositoryMetadata {
  url: string;
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
}

interface FileStructure {
  path: string;
  type: "file" | "dir";
  content?: string;
  size?: number;
}

export class GitHubService {
  private static octokit = new Octokit({
    auth: (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === "your_github_personal_access_token") ? undefined : process.env.GITHUB_TOKEN,
  });

  static parseRepoUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid GitHub URL");
    }
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  }

  static async getRepositoryMetadata(url: string): Promise<RepositoryMetadata> {
    const { owner, repo } = this.parseRepoUrl(url);

    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        url: data.html_url,
        owner: data.owner?.login || owner,
        name: data.name,
        description: data.description,
        language: data.language,
        stars: data.stargazers_count,
      };
    } catch (error) {
      console.error("Error fetching repository metadata:", error);
      throw new Error(`Failed to fetch repository metadata: ${error}`);
    }
  }

  static async getRepositoryInfo(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        description: data.description,
        language: data.language,
        stargazers_count: data.stargazers_count,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error("Error fetching repository info:", error);
      throw new Error(`Failed to fetch repository info: ${error}`);
    }
  }

  static async getAllFiles(owner: string, repo: string): Promise<FileStructure[]> {
    const files: FileStructure[] = [];
    
    try {
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "HEAD",
        recursive: "true",
      });

      for (const item of tree.tree) {
        if (item.type === "blob" && this.isRelevantFile(item.path || "")) {
          files.push({
            path: item.path || "",
            type: "file",
            size: item.size,
          });
        }
      }

      return files;
    } catch (error) {
      console.error("Error fetching repository files:", error);
      throw new Error(`Failed to fetch repository files: ${error}`);
    }
  }

  static async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(data) || data.type !== "file") {
        throw new Error("Expected file, got directory or other type");
      }

      if (!data.content) {
        throw new Error("File has no content");
      }

      return Buffer.from(data.content, "base64").toString("utf-8");
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      throw new Error(`Failed to fetch file content: ${error}`);
    }
  }

  static generateGitHubUrl(owner: string, repo: string, path: string, startLine?: number, endLine?: number): string {
    let url = `https://github.com/${owner}/${repo}/blob/main/${path}`;
    if (startLine !== undefined) {
      url += `#L${startLine}`;
      if (endLine !== undefined && endLine !== startLine) {
        url += `-L${endLine}`;
      }
    }
    return url;
  }

  private static isRelevantFile(path: string): boolean {
    const relevantExtensions = [
      ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".h",
      ".go", ".rs", ".rb", ".php", ".cs", ".swift", ".kt", ".scala",
      ".vue", ".svelte", ".html", ".css", ".scss", ".sass", ".less",
      ".json", ".yaml", ".yml", ".toml", ".md", ".txt", ".sh", ".bash",
      ".dockerfile", ".gitignore", ".env.example"
    ];

    const relevantFiles = [
      "README.md", "package.json", "requirements.txt", "Cargo.toml",
      "pom.xml", "build.gradle", "CMakeLists.txt", "Makefile", "setup.py",
      "composer.json", "gemfile", "go.mod", "pyproject.toml"
    ];

    const filename = path.split("/").pop()?.toLowerCase() || "";
    const extension = "." + filename.split(".").pop();

    if (relevantFiles.includes(filename)) return true;
    if (relevantExtensions.includes(extension)) return true;

    const ignoredDirs = [
      "node_modules", ".git", "dist", "build", "__pycache__", 
      ".next", ".nuxt", "vendor", "target", "bin", "obj",
      ".vscode", ".idea", "coverage", ".nyc_output"
    ];

    for (const dir of ignoredDirs) {
      if (path.includes(`/${dir}/`) || path.startsWith(`${dir}/`)) {
        return false;
      }
    }

    return false;
  }
}

/**
 * Exported function that tests expect
 * Parse repository metadata from owner/repo 
 */
export async function parseRepositoryMetadata(owner: string, repo: string) {
  return GitHubService.getRepositoryInfo(owner, repo);
}