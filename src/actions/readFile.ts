import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { HandlerResponse, LLMAction } from "./types";

export const readFileAction = {
  name: "READ_FILE",
  description: "Read file",
  similes: ["read", "get", "view"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora("Reading file...").start();
      spinner.color = "yellow";

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();
        return {
          success: false,
          context: `File ${action.filePath} does not exist.`,
        };
      }

      const fileContent = await fs.promises.readFile(action.filePath, "utf8");

      spinner.stop();

      console.log(chalk.green(`✅ Successfully read ${action.filePath}`));

      return {
        success: true,
        context: `
        File path: ${action.filePath}
        File content:  ${fileContent}
        -----------------------------
         `,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to read file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
