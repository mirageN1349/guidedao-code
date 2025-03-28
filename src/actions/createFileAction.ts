import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
import { HandlerResponse, LLMAction } from "./types";

export const createFileAction = {
  name: "CREATE_FILE",
  description: "Create file",
  similes: ["create", "new", "add"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora("Creating file...").start();
      spinner.color = "yellow";

      // Ensure directory exists
      const dirPath = path.dirname(action.filePath);
      await fs.promises.mkdir(dirPath, { recursive: true });

      const systemPrompt = `
        User request:
        ${action.prompt}

        Please generate content for a new file at ${action.filePath}.
        Please return ONLY CODE without any markup or formatting.
        Do not include any code fences or backticks in your response.
      `;

      const res = await generateText({
        runtime: agent,
        context: systemPrompt,
        modelClass: ModelClass.SMALL,
      });

      await fs.promises.writeFile(action.filePath, res);

      spinner.stop();

      console.log(chalk.green(`✅ Successfully created ${action.filePath}`));

      return {
        success: true,
        context: `File ${action.filePath} has been successfully created.`,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to create file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
