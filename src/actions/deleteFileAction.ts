import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { HandlerResponse, LLMAction } from "./types";

export const deleteFileAction = {
  name: "DELETE_FILE",
  description: "Delete file",
  similes: ["delete", "remove", "erase"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora("Deleting file...").start();
      spinner.color = "red";

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();
        return {
          success: false,
          context: `File ${action.filePath} does not exist.`,
        };
      }

      await fs.promises.unlink(action.filePath);

      spinner.stop();

      console.log(chalk.green(`✅ Successfully deleted ${action.filePath}`));

      return {
        success: true,
        context: `File ${action.filePath} has been successfully deleted.`,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to delete file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
