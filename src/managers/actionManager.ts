import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import inquirer from "inquirer";
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

export const actions = [
  { name: "EDIT_FILE", description: "Edit file" },
  { name: "CREATE_FILE", description: "Create file" },
  { name: "DELETE_FILE", description: "Delete file" },
  { name: "MOVE_FILE", description: "Move file" },
  { name: "READ_FILE", description: "Read file" },
  { name: "SEARCH_FILES", description: "Search files by pattern or content" },
  { name: "FIX_BROWSER_ERRORS", description: "Fix browser errors" },
];

const actionHandlers = {
  EDIT_FILE: editFileAction.handler,
  CREATE_FILE: createFileAction.handler,
  READ_FILE: readFileAction.handler,
  DELETE_FILE: deleteFileAction.handler,
  MOVE_FILE: moveFileAction.handler,
  SEARCH_FILES: searchFilesAction,
  FIX_BROWSER_ERRORS: fixBrowserErrorsAction.handler,
} as const;

const getOperationTypeFromAction = (actionName: string): OperationType => {
  switch (actionName) {
    case "READ_FILE":
      return "read";
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
    action.context.notes = [];
  }
  if (!action.context.fileOperations) {
    action.context.fileOperations = [];
  }

  return action;
};

export const executeWithConfirmation = async (
  agent: AgentRuntime,
  action: LLMAction,
) => {
  action = ensureActionContext(action);

  const handler = actionHandlers[action.name];
  if (!handler) {
    throw new Error(`Action ${action.name} not found`);
  }

  if (
    (action.name === "CREATE_FILE" || action.name === "EDIT_FILE") &&
    action.code
  ) {
    const boxWidth = 100;

    const topLeft = "╔";
    const topRight = "╗";
    const bottomLeft = "╚";
    const bottomRight = "╝";
    const horizontal = "═";
    const vertical = "║";
    const leftT = "╠";
    const rightT = "╣";

    console.log(
      "\n" +
        chalk.cyan.bold(topLeft + horizontal.repeat(boxWidth - 2) + topRight),
    );

    // Draw title
    const title = "📄 FILE CHANGES";
    const padding = Math.floor((boxWidth - 2 - title.length) / 2);
    console.log(
      chalk.cyan.bold(vertical) +
        " ".repeat(padding) +
        chalk.cyan.bold(title) +
        " ".repeat(boxWidth - 2 - title.length - padding) +
        chalk.cyan.bold(vertical),
    );

    console.log(
      chalk.cyan.bold(leftT + horizontal.repeat(boxWidth - 2) + rightT),
    );

    try {
      const formatDiff = (diff: string): void => {
        const lines = diff.split("\n");

        for (const line of lines) {
          let formattedLine;
          const plainLine = line.replace(/\u001b\[\d+m/g, ""); // Remove ANSI color codes for length calc

          if (
            line.startsWith("+++ ") ||
            line.startsWith("--- ") ||
            line.startsWith("@@")
          ) {
            formattedLine = chalk.cyan(line);
          } else if (line.startsWith("+")) {
            formattedLine = chalk.green(line);
          } else if (line.startsWith("-")) {
            formattedLine = chalk.red(line);
          } else {
            formattedLine = line;
          }

          const padLength = Math.max(1, boxWidth - 3 - plainLine.length);
          console.log(
            chalk.cyan.bold(vertical) +
              " " +
              formattedLine +
              " ".repeat(padLength) +
              chalk.cyan.bold(vertical),
          );
        }
      };

      if (action.name === "CREATE_FILE") {
        const subheader = `📝 Creating: ${action.filePath}`;
        const subheaderPlain = subheader.replace(/\u001b\[\d+m/g, "");
        console.log(
          chalk.cyan.bold(vertical) +
            " " +
            chalk.cyan.bold(subheader) +
            " ".repeat(Math.max(1, boxWidth - 3 - subheaderPlain.length)) +
            chalk.cyan.bold(vertical),
        );
        console.log(
          chalk.cyan.bold(leftT + horizontal.repeat(boxWidth - 2) + rightT),
        );

        const diffResult = diffLib.createPatch(
          action.filePath,
          "",
          action.code,
          "Empty file",
          "New file content",
        );
        formatDiff(diffResult);
      } else if (action.name === "EDIT_FILE") {
        if (fs.existsSync(action.filePath)) {
          const subheader = `✏️ Editing: ${action.filePath}`;
          const subheaderPlain = subheader.replace(/\u001b\[\d+m/g, "");
          console.log(
            chalk.cyan.bold(vertical) +
              " " +
              chalk.cyan.bold(subheader) +
              " ".repeat(Math.max(1, boxWidth - 3 - subheaderPlain.length)) +
              chalk.cyan.bold(vertical),
          );
          console.log(
            chalk.cyan.bold(leftT + horizontal.repeat(boxWidth - 2) + rightT),
          );

          const oldContent = fs.readFileSync(action.filePath, "utf-8");
          const diffResult = diffLib.createPatch(
            action.filePath,
            oldContent,
            action.code,
            "Original content",
            "Modified content",
          );
          formatDiff(diffResult);
        } else {
          const errorMsg = `⚠️ File ${action.filePath} does not exist for editing`;
          console.log(
            chalk.cyan.bold(vertical) +
              " " +
              chalk.red(errorMsg) +
              " ".repeat(Math.max(1, boxWidth - 3 - errorMsg.length)) +
              chalk.cyan.bold(vertical),
          );
        }
      }

      console.log(
        chalk.cyan.bold(
          bottomLeft + horizontal.repeat(boxWidth - 2) + bottomRight,
        ),
      );
    } catch (error) {
      const errorMsg = `Error generating diff: ${(error as any).message}`;
      console.log(
        chalk.cyan.bold(vertical) +
          " " +
          chalk.red(errorMsg) +
          " ".repeat(Math.max(1, boxWidth - 3 - errorMsg.length)) +
          chalk.cyan.bold(vertical),
      );
      console.log(
        chalk.cyan.bold(
          bottomLeft + horizontal.repeat(boxWidth - 2) + bottomRight,
        ),
      );
    }
  }

  const operationType = getOperationTypeFromAction(action.name);
  contextManager.addFileOperation(
    operationType,
    action.filePath,
    `${action.name}: ${action.prompt.substring(0, 100)}${action.prompt.length > 100 ? "..." : ""}`,
  );

  if (action.name === "READ_FILE" || action.name === "SEARCH_FILES") {
    const result = await handler(agent, action);
    return result;
  }

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
    const cancelContext: ActionContext = {
      ...action.context,
      lastActionResult: {
        success: false,
        message: "Action cancelled by user.",
      },
    };

    return {
      success: false,
      context: cancelContext,
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
