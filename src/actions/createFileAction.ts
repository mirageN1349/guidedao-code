import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
import { ActionContext, HandlerResponse, LLMAction } from "./types";

export const createFileAction = {
  name: "CREATE_FILE",
  description: "Create file",
  similes: ["create", "new", "add"],
  handler: async (
    agent: AgentRuntime,
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

        fileContent = await generateText({
          runtime: agent,
          context: systemPrompt,
          modelClass: ModelClass.SMALL,
        });
      }

      await fs.promises.writeFile(action.filePath, fileContent);

      spinner.stop();

      console.log(chalk.green(`✅ Successfully created ${action.filePath}`));

      const successMessage = `Successfully created ${action.filePath}`;

      context.fileOperations.push({
        type: "create",
        filePath: action.filePath,
        description: `Created new file based on prompt: ${action.prompt.substring(0, 100)}${action.prompt.length > 100 ? "..." : ""}`,
        timestamp: Date.now(),
      });

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      context.notes.push(successMessage);

      if (fileContent.length > 0) {
        const contentPreview =
          fileContent.length > 200
            ? fileContent.substring(0, 200) + "..."
            : fileContent;
        context.notes.push(
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

      context.notes.push(errorMessage);

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
