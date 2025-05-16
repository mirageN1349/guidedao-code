import { glob } from "glob";
import fs from "fs";
import path from "path";
import { HandlerResponse, LLMAction } from "./types";
import { AnthropicClient } from "../anthropic-client";
import chalk from "chalk";
import ora from "ora";
import { contextManager } from "../managers/contextManager";

interface SearchParams {
  pattern?: string;
  content?: string;
}

interface SearchResult {
  file: string;
  matches?: { line: number; text: string }[];
}

export const searchFilesAction = async (
  agent: AnthropicClient,
  action: LLMAction,
): Promise<HandlerResponse> => {
  try {
    // Используем action.code для получения параметров поиска
    let params: SearchParams;

    if (action.code) {
      if (typeof action.code === "string") {
        try {
          params = JSON.parse(action.code);
        } catch (error) {
          console.error("Error parsing search parameters:", error);
          params = { content: action.code };
        }
      } else {
        params = action.code as unknown as SearchParams;
      }
    } else if (action.prompt) {
      params = { content: action.prompt };
    } else {
      return {
        context: action.context,
        success: false,
        message: "Search criteria not provided",
      };
    }

    const spinner = ora("Searching files...").start();
    spinner.color = "white";

    const searchResults = await searchFiles(params.pattern, params.content);

    spinner.stop();

    console.log(
      chalk.green(
        `🔍 Successfully searched for files with pattern '${params.pattern || "*"}' containing '${params.content || ""}'`,
      ),
    );

    contextManager.addFileOperation(
      "search",
      params.pattern || "*",
      `Searched for files with pattern '${params.pattern || "*"}' containing '${params.content || ""}'`,
    );

    const message = formatSearchResults(searchResults);
    contextManager.addNote(message);

    return {
      context: action.context,
      success: true,
      message: message,
    };
  } catch (error) {
    console.error("Error searching files:", error);
    return {
      context: action.context,
      success: false,
      message: `Error searching files: ${error}`,
    };
  }
};

async function searchFiles(
  pattern?: string,
  content?: string,
): Promise<SearchResult[]> {
  const filePattern = pattern || "**/*";
  const results: SearchResult[] = [];

  try {
    const files = await glob(filePattern, {
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    });

    if (!content) {
      return files.map((file) => ({ file }));
    }

    for (const file of files) {
      try {
        const stat = fs.statSync(file);

        if (stat.isDirectory() || isBinaryFile(file)) {
          continue;
        }

        const fileContent = fs.readFileSync(file, "utf8");
        const lines = fileContent.split("\n");
        const matches: { line: number; text: string }[] = [];

        lines.forEach((line, index) => {
          if (line.includes(content)) {
            matches.push({ line: index + 1, text: line.trim() });
          }
        });

        if (matches.length > 0) {
          results.push({ file, matches });
        }
      } catch (err) {
        console.error(`Error reading file ${file}:`, err);
      }
    }

    return results;
  } catch (error) {
    console.error("Error during file search:", error);
    throw error;
  }
}

function isBinaryFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase();
  const binaryExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".tiff",
    ".ico",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".7z",
    ".rar",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    ".dat",
    ".db",
    ".sqlite",
    ".class",
    ".jar",
    ".war",
  ];

  return binaryExtensions.includes(extension);
}

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "🔍 No matching files found.";
  }

  let output = `🔍 Found ${results.length} matching file(s):\n\n`;

  results.forEach((result) => {
    output += `File: ${result.file}\n`;

    if (result.matches && result.matches.length > 0) {
      output += `Matches (${result.matches.length}):\n`;
      const displayMatches = result.matches.slice(0, 5);
      displayMatches.forEach((match) => {
        output += `  Line ${match.line}: ${match.text}\n`;
      });

      if (result.matches.length > 5) {
        output += `  ... and ${result.matches.length - 5} more matches\n`;
      }
    }
    output += "\n";
  });

  return output;
}
