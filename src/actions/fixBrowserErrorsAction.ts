import { AgentRuntime } from "@elizaos/core";
import ora from "ora";
import chalk from "chalk";

import { mcpBrowserClient } from "../mcp-clients/browser-mcp-client";

import { ActionContext, HandlerResponse, LLMAction } from "./types";
import { contextManager } from "../managers/contextManager";

export const fixBrowserErrorsAction = {
  name: "FIX_BROWSER_ERRORS",
  description: "Fix browser errors",
  similes: ["fix errros"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    const context: ActionContext = action.context || {
      fileOperations: [],
      notes: [],
    };

    try {
      const spinner = ora({
        text: "Extracting errors...",
        color: "green",
      }).start();

      const mcpRes = await mcpBrowserClient.sendRequest("console-errors");

      spinner.stop();

      console.log(chalk.green(`🔧 Successfully extracted errors from browser`));

      const successMessage =
        "🔧 Successfully extracted browser errors for analysis";

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      contextManager.addNote(successMessage);

      contextManager.addNote(`Browser errors: ${mcpRes}`);

      return {
        success: true,
        context,
        message: successMessage,
      };
    } catch (error) {
      const errorMessage = `Failed to extract browser errors: ${(error as any).message}`;

      context.lastActionResult = {
        success: false,
        message: errorMessage,
      };

      contextManager.addNote(errorMessage);

      return {
        success: false,
        context,
        message: errorMessage,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
