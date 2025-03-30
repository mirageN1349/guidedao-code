import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
import { ActionContext, HandlerResponse, LLMAction } from "./types";

export const moveFileAction = {
  name: "MOVE_FILE",
  description: "Move file",
  similes: ["move", "rename", "relocate"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    const context: ActionContext = action.context || {
      fileOperations: [],
      notes: [],
    };

    try {
      const spinner = ora("Moving file...").start();
      spinner.color = "blue";

      const match = action.prompt.match(/to\s+(["']?)([^"'\s]+)\1/i);
      if (!match) {
        spinner.stop();

        const errorMessage =
          "Could not determine destination path from prompt. Please specify 'to [destination]' in the prompt.";

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

      const destinationPath = match[2];

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();

        const errorMessage = `Source file ${action.filePath} does not exist.`;

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

      const destDir = path.dirname(destinationPath);
      await fs.promises.mkdir(destDir, { recursive: true });

      await fs.promises.rename(action.filePath, destinationPath);

      spinner.stop();

      console.log(
        chalk.green(
          `✅ Successfully moved ${action.filePath} to ${destinationPath}`,
        ),
      );

      const successMessage = `Successfully moved file from ${action.filePath} to ${destinationPath}`;

      context.fileOperations.push({
        type: "move",
        filePath: action.filePath,
        description: `Moved file to ${destinationPath}`,
        timestamp: Date.now(),
      });

      context.fileOperations.push({
        type: "create",
        filePath: destinationPath,
        description: `Created from moved file ${action.filePath}`,
        timestamp: Date.now(),
      });

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      context.notes.push(successMessage);

      return {
        success: true,
        context,
        message: successMessage,
      };
    } catch (error) {
      const errorMessage = `Failed to move file ${action.filePath}: ${(error as any).message}`;

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
