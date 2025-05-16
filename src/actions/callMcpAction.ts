import { AnthropicClient } from "../anthropic-client";
import chalk from "chalk";
import ora from "ora";
import { ActionContext, HandlerResponse, LLMAction } from "./types";
import { contextManager } from "../managers/contextManager";
import { mcpFactory } from "../mcp-clients/mcp-factory";

export const callMcpAction = {
  name: "CALL_MCP",
  description: "Call MCP",
  similes: ["call"],
  handler: async (
    _agent: AnthropicClient,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    const context: ActionContext = action.context || {
      fileOperations: [],
      notes: [],
    };

    try {
      const spinner = ora("Call mcp...").start();
      spinner.color = "blue";

      if (!action.mcpRequestParams) {
        return {
          success: false,
          context,
        };
      }

      const response = await mcpFactory.call(action.mcpRequestParams);

      console.log("response: ", response);

      spinner.stop();

      console.log(
        chalk.green(
          `📖 Successfully called ${action.mcpRequestParams.clientName}`,
        ),
      );

      // contextManager.addNote(
      //   `Called MCP client ${action.mcpRequestParams.clientName}.  Response: ${JSON.stringify(response)}`,
      // );
      //
      context.notes.push({
        content: `Called MCP client ${action.mcpRequestParams.clientName}.  Response: ${JSON.stringify(response)}`,
        tokensCount: 1,
      });

      const successMessage = `📖 Successfully called ${action.mcpRequestParams.clientName}`;

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      return {
        success: true,
        context,
        toolName: action.mcpRequestParams.params.name,
        message: successMessage,
      };
    } catch (error) {
      const errorMessage = `Failed to read file ${action.filePath}: ${(error as any).message}`;

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
