import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { ActionContext, HandlerResponse, LLMAction } from "./types";

export const deleteFileAction = {
  name: "DELETE_FILE",
  description: "Delete file",
  similes: ["delete", "remove", "erase"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    const context: ActionContext = action.context || {
      fileOperations: [],
      notes: [],
    };

    try {
      const spinner = ora("Deleting file...").start();
      spinner.color = "red";

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();

        const errorMessage = `File ${action.filePath} does not exist.`;

        context.lastActionResult = {
          success: false,
          message: errorMessage,
        };

        if (!context.notes) {
          context.notes = [];
        }
        context.notes.push(errorMessage);

        return {
          success: false,
          context,
          message: errorMessage,
        };
      }

      let filePreview = "";
      try {
        const fileContent = await fs.promises.readFile(
          action.filePath,
          "utf-8",
        );
        filePreview =
          fileContent.length > 200
            ? fileContent.substring(0, 200) + "..."
            : fileContent;
      } catch (e) {}

      await fs.promises.unlink(action.filePath);

      spinner.stop();

      console.log(chalk.green(`🗑️ Successfully deleted ${action.filePath}`));

      const successMessage = `🗑️ Successfully deleted ${action.filePath}`;

      context.fileOperations.push({
        type: "delete",
        filePath: action.filePath,
        description: `Deleted file as requested: ${action.prompt.substring(0, 100)}${action.prompt.length > 100 ? "..." : ""}`,
        timestamp: Date.now(),
      });

      context.lastActionResult = {
        success: true,
        message: successMessage,
      };

      context.notes.push(successMessage);

      if (filePreview) {
        context.notes.push(
          `Deleted file content preview: ${filePreview.split("\n")[0]}`,
        );
      }

      return {
        success: true,
        context,
        message: successMessage,
      };
    } catch (error) {
      const errorMessage = `Failed to delete file ${action.filePath}: ${(error as any).message}`;

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
