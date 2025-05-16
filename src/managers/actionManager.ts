import { AnthropicClient } from "../anthropic-client";
import chalk from "chalk";
import fs from "node:fs";
import * as diffLib from "diff";
import { editFileAction } from "../actions/editFileActon";
import { createFileAction } from "../actions/createFileAction";
import { deleteFileAction } from "../actions/deleteFileAction";
import { moveFileAction } from "../actions/moveFileAction";
import { fixBrowserErrorsAction } from "../actions/fixBrowserErrorsAction";
import { ActionContext, LLMAction, OperationType } from "../actions/types";
import { readFileAction } from "../actions/readFile";
import { searchFilesAction } from "../actions/searchFilesAction";
import { contextManager } from "./contextManager";
import { callMcpAction } from "../actions/callMcpAction";
import {
  createConfirmationPromise,
  generateActionDiff,
} from "../modules/cli/lib/confirmationUtils";

export const actions = [
  // { name: "EDIT_FILE", description: "Edit file" },
  // { name: "CREATE_FILE", description: "Create file" },
  // { name: "DELETE_FILE", description: "Delete file" },
  // { name: "MOVE_FILE", description: "Move file" },
  // { name: "READ_FILE", description: "Read file" },
  // { name: "SEARCH_FILES", description: "Search files by pattern or content" },
  // { name: "FIX_BROWSER_ERRORS", description: "Fix browser errors" },
  { name: "CALL_MCP", description: "Call MCP clients" },
];

const actionHandlers = {
  // EDIT_FILE: editFileAction.handler,
  // CREATE_FILE: createFileAction.handler,
  // READ_FILE: readFileAction.handler,
  // DELETE_FILE: deleteFileAction.handler,
  // MOVE_FILE: moveFileAction.handler,
  // SEARCH_FILES: searchFilesAction,
  // FIX_BROWSER_ERRORS: fixBrowserErrorsAction.handler,
  CALL_MCP: callMcpAction.handler,
} as const;

const getOperationTypeFromAction = (actionName: string): OperationType => {
  switch (actionName) {
    case "READ_FILE":
      return "read";
    case "CALL_MCP":
      return "call_mcp";
    case "EDIT_FILE":
    case "FIX_BROWSER_ERRORS":
      return "edit";
    case "CREATE_FILE":
      return "create";
    case "DELETE_FILE":
      return "delete";
    case "MOVE_FILE":
      return "move";
    case "SEARCH_FILES":
      return "search";
    default:
      return "read";
  }
};

const ensureActionContext = (action: LLMAction): LLMAction => {
  if (!action.context || typeof action.context === "string") {
    const notes = typeof action.context === "string" ? [action.context] : [];

    return {
      ...action,
      context: {
        fileOperations: [],
        notes,
      },
    };
  }

  if (!action.context.notes) {
    // action.context.notes = [];
  }
  if (!action.context.fileOperations) {
    action.context.fileOperations = [];
  }

  return action;
};

export const executeWithConfirmation = async (
  agent: AnthropicClient,
  action: LLMAction,
) => {
  action = ensureActionContext(action);

  const handler = actionHandlers[action.name];
  if (!handler) {
    throw new Error(`Action ${action.name} not found`);
  }

  const operationType = getOperationTypeFromAction(action.name);
  contextManager.addFileOperation(
    operationType,
    action.filePath,
    `${action.name}: ${action.prompt.substring(0, 100)}${action.prompt.length > 100 ? "..." : ""}`,
  );

  // if (action.name === "READ_FILE" || action.name === "SEARCH_FILES") {
  const result = await handler(agent, action);
  return result;
  // }

  // const fileDiff = generateActionDiff(
  //   action.name,
  //   action.filePath,
  //   action.code,
  // );

  // const confirmationResult = await createConfirmationPromise(
  //   `Do you want to proceed with action: ${action.name}?`,
  //   action.prompt,
  //   fileDiff,
  // );

  // // Clear the file diff after confirmation
  // try {
  //   if (action.updateFileDiff && typeof action.updateFileDiff === "function") {
  //     action.updateFileDiff(undefined);

  //     // Add a small delay to ensure UI state updates correctly
  //     await new Promise((resolve) => setTimeout(resolve, 100));
  //   }
  // } catch (e) {
  //   console.error("Error clearing file diff:", e);
  // }

  // if (!confirmationResult.confirmed) {
  //   console.log(chalk.red("❌ Action cancelled by user."));
  //   const cancelContext: ActionContext = {
  //     ...action.context,
  //     lastActionResult: {
  //       success: false,
  //       message: "Action cancelled by user.",
  //     },
  //   };

  // return {
  //   success: false,
  //   context: cancelContext,
  //   message: "Action cancelled by user.",
  // };
};

// if (confirmationResult.modifiedPrompt) {
//   action.prompt = confirmationResult.modifiedPrompt;
//   console.log(chalk.blue("Prompt modified. Continuing with updated prompt."));
// }

// const result = await handler(agent, action);
// if (!result.success) {
// }
// return result;
