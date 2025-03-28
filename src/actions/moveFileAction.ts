import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
import { HandlerResponse, LLMAction } from "./types";

export const moveFileAction = {
  name: "MOVE_FILE",
  description: "Move file",
  similes: ["move", "rename", "relocate"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora("Moving file...").start();
      spinner.color = "blue";

      const match = action.prompt.match(/to\s+(["']?)([^"'\s]+)\1/i);
      if (!match) {
        spinner.stop();
        return {
          success: false,
          context:
            "Could not determine destination path from prompt. Please specify 'to [destination]' in the prompt.",
        };
      }

      const destinationPath = match[2];

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();
        return {
          success: false,
          context: `Source file ${action.filePath} does not exist.`,
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

      return {
        success: true,
        context: `File moved from ${action.filePath} to ${destinationPath} successfully.`,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to move file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
