import { AnthropicClient } from "../anthropic-client";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
import { ActionContext, HandlerResponse, LLMAction } from "./types";
import { contextManager } from "../managers/contextManager";

export const createFileAction = {
  name: "CREATE_FILE",
  description: "Create file",
  similes: ["create", "new", "add"],
  handler: async (
    agent: AnthropicClient,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    const context: ActionContext = action.context || {
      fileOperations: [],
      notes: [],
    };

    try {
      const spinner = ora("Creating file...").start();
      spinner.color = "yellow";

      const dirPath = path.dirname(action.filePath);
      await fs.promises.mkdir(dirPath, { recursive: true });

      let fileContent: string;

      if (action.code) {
        fileContent = action.code;
      } else {
        const systemPrompt = `
        User request:
        ${action.prompt}

        Please generate content for a new file at ${action.filePath}.
        Please return ONLY CODE without any markup or formatting.
        Do not include any code fences or backticks in your response.
      `;

        fileContent = await agent.generateText(systemPrompt, {
          model: 'claude-3-7-sonnet-20250219',
          maxTokens: 4096
        });
      }

      await fs.promises.writeFile(action.filePath, fileContent);

      spinner.stop();

      console.log(chalk.green(`🆕 Successfully created ${action.filePath}`));

      const successMessage = `🆕 Successfully created ${action.filePath}`;

      contextManager.addFileOperation(
        "create",
        action.filePath,
        `Created new file based on prompt: ${action.prompt.substring(0, 100)}${action.prompt.length > 100 ? "..." : ""}`,
      );

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      contextManager.addNote(successMessage);

      if (fileContent.length > 0) {
        const contentPreview =
          fileContent.length > 200
            ? fileContent.substring(0, 200) + "..."
            : fileContent;
        contextManager.addNote(
          `File content preview: ${contentPreview.split("\n")[0]}`,
        );
      }

      return {
        success: true,
        context,
        message: successMessage,
      };
    } catch (error) {
      const errorMessage = `Failed to create file ${action.filePath}: ${(error as any).message}`;

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
