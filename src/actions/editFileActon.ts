import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { HandlerResponse, LLMAction } from "./types";

export const editFileAction = {
  name: "EDIT_FILE",
  description: "Edit file",
  similes: ["edit", "update"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora("Editing file...").start();
      spinner.color = "red";
      const fileContent = await fs.promises.readFile(action.filePath, "utf-8");

      const systemPrompt = `
        Original file content:
        \`\`\`
        ${fileContent}
        \`\`\`

        User request:
        ${action.prompt}

        Please provide the complete updated content for this file.
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

      console.log(chalk.green(`✅ Successfully edited ${action.filePath}`));

      return {
        success: true,
        context: `File ${action.filePath} has been successfully edited.`,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to edit file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
