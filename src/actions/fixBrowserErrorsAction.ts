import { AgentRuntime } from "@elizaos/core";
import ora from "ora";
import chalk from "chalk";

import { LLMAction } from "../actionManager";
import { mcpBrowserClient } from "../mcp-clients/browser-mcp-client";
import { makeActionsList } from "../llm/makeActionsList";

export const fixBrowserErrorsAction = {
  name: "FIX_BROWSER_ERRORS",
  description: "Fix browser errors",
  similes: ["fix errros"],
  handler: async (agent: AgentRuntime, action: LLMAction) => {
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
