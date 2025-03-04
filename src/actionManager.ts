import { Action, AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import fs from 'fs';
import ora from "ora";

export type ActionName = "EDIT_FILE" | "CREATE_FILE" | "DELETE_FILE" | "MOVE_FILE" | "EXPLAIN_FILE";

export type LLMAction = {
  name: ActionName;
  filePath: string;
  prompt: string;
};

export const actions = [
  { name: "EDIT_FILE", description: "Edit file" },
  { name: "CREATE_FILE", description: "Create file" },
  { name: "DELETE_FILE", description: "Delete file" },
  { name: "MOVE_FILE", description: "Move file" },
  { name: "EXPLAIN_FILE", description: "Explain file" },
]


// export const editFileAction: Action = {
export const editFileAction = {
  name: "EDIT_FILE",
  description: 'Edit file',
  similes: ["edit", 'update'],
  handler: async (agent: AgentRuntime, action: LLMAction) => {
    try {
      ora('Editing file...').start();
      const fileContent = await fs.promises.readFile(action.filePath, 'utf-8');

      const systemPrompt = `
        Original file content:
        \`\`\`
        ${fileContent}
        \`\`\`

        User request:
        ${action.prompt}

        Please provide the complete updated content for this file.
        Please return ONLY CODE without MARKDOWN and formatting.
      `;

      const res = await generateText({
        runtime: agent,
        context: systemPrompt,
        modelClass: ModelClass.SMALL,
      });

      await fs.promises.writeFile(action.filePath, res);

      console.log(chalk.green(`✅ Successfully edited ${action.filePath}`));

      return {
        success: true,
        message: `File ${action.filePath} has been successfully edited.`,
        content: res
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to edit file ${action.filePath}: ${(error as any).message}`
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: []
};
