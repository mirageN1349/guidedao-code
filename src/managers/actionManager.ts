import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import inquirer from "inquirer";
import { editFileAction } from "../actions/editFileActon";
import { createFileAction } from "../actions/createFileAction";
import { deleteFileAction } from "../actions/deleteFileAction";
import { moveFileAction } from "../actions/moveFileAction";
import { explainFileAction } from "../actions/explainFileAction";
import { fixBrowserErrorsAction } from "../actions/fixBrowserErrorsAction";
import { refactorCodeAction } from "../actions/refactorCodeAction";
import { LLMAction } from "../actions/types";
import { readFileAction } from "../actions/readFile";

export const actions = [
  { name: "EDIT_FILE", description: "Edit file" },
  { name: "CREATE_FILE", description: "Create file" },
  { name: "DELETE_FILE", description: "Delete file" },
  { name: "MOVE_FILE", description: "Move file" },
  { name: "EXPLAIN_FILE", description: "Explain file" },
  { name: "READ_FILE", description: "Read file" },
  { name: "FIX_BROWSER_ERRORS", description: "Fix browser errors" },
  { name: "REFACTOR_CODE", description: "Refactor code" },
];

const actionHandlers = {
  EDIT_FILE: editFileAction.handler,
  CREATE_FILE: createFileAction.handler,
  READ_FILE: readFileAction.handler,
  DELETE_FILE: deleteFileAction.handler,
  MOVE_FILE: moveFileAction.handler,
  EXPLAIN_FILE: explainFileAction.handler,
  FIX_BROWSER_ERRORS: fixBrowserErrorsAction.handler,
  REFACTOR_CODE: refactorCodeAction.handler,
} as const;

export const executeWithConfirmation = async (
  agent: AgentRuntime,
  action: LLMAction,
) => {
  const handler = actionHandlers[action.name];
  if (!handler) {
    throw new Error(`Action ${action.name} not found`);
  }

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
    console.log(chalk.red("❌ Action cancelled by user."));
    return {
      success: false,
      context: "Action cancelled by user.",
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