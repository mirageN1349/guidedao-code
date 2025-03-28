import { AgentRuntime } from "@elizaos/core";
import ora from "ora";
import chalk from "chalk";

import { mcpBrowserClient } from "../mcp-clients/browser-mcp-client";
import { makeActionsList } from "../llm/makeActionsList";

import { HandlerResponse, LLMAction } from "./types";

export const fixBrowserErrorsAction = {
  name: "FIX_BROWSER_ERRORS",
  description: "Fix browser errors",
  similes: ["fix errros"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora({
        text: "Extracting errors...",
        color: "green",
      }).start();

      const mcpRes = await mcpBrowserClient.sendRequest("console-errors");

      const actions = makeActionsList(
        agent,
        `
        fix browser  errors ${mcpRes}
        `,
      );

      spinner.stop();

      console.log(chalk.green(`✅ Successfully extracted errors from browser`));

      return {
        success: true,
        context: `Successfully extracted browser errors.`,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to extract browser errors: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
