import { AgentRuntime } from "@elizaos/core";
import ora from "ora";
import chalk from "chalk";

import { mcpBrowserClient } from "../mcp-clients/browser-mcp-client";
import { makeActionsList } from "../llm/makeActionsList";

import { ActionContext, HandlerResponse, LLMAction } from "./types";

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

      await makeActionsList(agent, `fix browser errors ${mcpRes}`);

      spinner.stop();

      console.log(chalk.green(`✅ Successfully extracted errors from browser`));

      const successMessage =
        "Successfully extracted browser errors for analysis";

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      context.notes.push(successMessage);

      context.notes.push(`Browser errors: ${mcpRes}`);

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

      context.notes.push(errorMessage);

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
