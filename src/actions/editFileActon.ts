import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { ActionContext, HandlerResponse, LLMAction } from "./types";
import { contextManager } from "../managers/contextManager";

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

      const context: ActionContext = action.context || {
        fileOperations: [],
        notes: [],
      };

      let updatedContent: string;

      if (action.code) {
        updatedContent = action.code;
      } else {
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

        updatedContent = await generateText({
          runtime: agent,
          context: systemPrompt,
          modelClass: ModelClass.SMALL,
        });
      }

      await fs.promises.writeFile(action.filePath, updatedContent);

      spinner.stop();

      console.log(chalk.green(`✏️ Successfully edited ${action.filePath}`));

      const successMessage = `✏️ Successfully edited ${action.filePath}`;

      contextManager.addFileOperation(
        "edit",
        action.filePath,
        `Edited file according to prompt: ${action.prompt.substring(0, 100)}${action.prompt.length > 100 ? "..." : ""}`,
      );

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      contextManager.addNote(successMessage);

      return {
        success: true,
        context,
        message: successMessage,
      };
    } catch (error) {
      const errorMessage = `Failed to edit file ${action.filePath}: ${(error as any).message}`;

      const errorContext: ActionContext = action.context || {
        fileOperations: [],
        notes: [],
      };

      errorContext.lastActionResult = {
        success: false,
        message: errorMessage,
      };

      contextManager.addNote(errorMessage);

      return {
        success: false,
        context: errorContext,
        message: errorMessage,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
