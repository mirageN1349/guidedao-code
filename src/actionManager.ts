import { Action, AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";

export type ActionName =
  | "EDIT_FILE"
  | "CREATE_FILE"
  | "DELETE_FILE"
  | "MOVE_FILE"
  | "EXPLAIN_FILE"
  | "FIX_BROWSER_ERRORS";

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
  { name: "FIX_BROWSER_ERRORS", description: "Fix browser errors" },
];

// export const editFileAction: Action = {
export const editFileAction = {
  name: "EDIT_FILE",
  description: "Edit file",
  similes: ["edit", "update"],
  handler: async (agent: AgentRuntime, action: LLMAction) => {
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
        message: `File ${action.filePath} has been successfully edited.`,
        content: res,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to edit file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};

const actionHandlers = {
  EDIT_FILE: editFileAction.handler,
  CREATE_FILE: editFileAction.handler,
  DELETE_FILE: editFileAction.handler,
  MOVE_FILE: editFileAction.handler,
  EXPLAIN_FILE: editFileAction.handler,
  FIX_BROWSER_ERRORS: editFileAction.handler,
} as const;

export const executeWithConfirmation = async (
  agent: AgentRuntime,
  action: LLMAction,
) => {
  const handler = actionHandlers[action.name];
  if (!handler) {
    throw new Error(`Action ${action.name} not found`);
  }

  // Import inquirer dynamically to avoid issues with ESM/CJS compatibility

  console.log(chalk.yellow(`Action: ${action.name}`));
  console.log(chalk.yellow(`File: ${action.filePath}`));
  console.log(chalk.yellow(`Prompt: ${action.prompt}`));

  const { confirmation } = await inquirer.prompt([
    {
      type: "list",
      name: "confirmation",
      message: "Do you want to proceed with this action?",
      choices: [
        { name: "Yes", value: "yes" },
        { name: "No", value: "no" },
        { name: "Modify", value: "modify" },
      ],
    },
  ]);

  if (confirmation === "no") {
    console.log(chalk.red("Action cancelled by user."));
    return {
      success: false,
      message: "Action cancelled by user.",
    };
  }

  if (confirmation === "modify") {
    const { modifiedPrompt } = await inquirer.prompt([
      {
        type: "input",
        name: "modifiedPrompt",
        message: "Enter modified prompt:",
        default: action.prompt,
      },
    ]);

    action.prompt = modifiedPrompt;
    console.log(chalk.blue("Prompt modified. Continuing with updated prompt."));
  }

  return handler(agent, action);
};

// Yes
// No
// modify
