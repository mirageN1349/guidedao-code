import { AnthropicClient } from "../anthropic-client";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { ActionContext, HandlerResponse, LLMAction } from "./types";
import { contextManager } from "../managers/contextManager";

export const readFileAction = {
  name: "READ_FILE",
  description: "Read file",
  similes: ["read", "get", "view"],
  handler: async (
    agent: AnthropicClient,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    const context: ActionContext = action.context || {
      fileOperations: [],
      notes: [],
    };

    try {
      const spinner = ora("Reading file...").start();
      spinner.color = "yellow";

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();

        const errorMessage = `File ${action.filePath} does not exist.`;

        context.lastActionResult = {
          success: false,
          message: errorMessage,
        };

        contextManager.addNote(errorMessage);

        return {
          success: false,
          context,
          message: errorMessage,
        };
      }

      const fileContent = await fs.promises.readFile(action.filePath, "utf8");

      spinner.stop();

      console.log(chalk.green(`📖 Successfully read ${action.filePath}`));

      contextManager.addFileOperation(
        "read",
        action.filePath,
        `Read file content for analysis`,
      );

      const successMessage = `📖 Successfully read ${action.filePath}`;

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      contextManager.addNote(
        `Read file ${action.filePath} (${fileContent.length} bytes)`,
      );

      const fileContentFormatted = `
      File path: ${action.filePath}
      File content: ${fileContent}
      -----------------------------
      `;
      contextManager.addNote(fileContentFormatted);

      return {
        success: true,
        context,
        message: successMessage,
      };
    } catch (error) {
      const errorMessage = `Failed to read file ${action.filePath}: ${(error as any).message}`;

      context.lastActionResult = {
        success: false,
        message: errorMessage,
      };

      contextManager.addNote(errorMessage);

      return {
        success: false,
        context,
        message: errorMessage,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
