import { AnthropicClient } from "../../../anthropic-client";
import { chooseNextAction } from "../../llm/makeActionsList";
import { executeWithConfirmation } from "../../../managers/actionManager";
import { contextManager } from "../../../managers/contextManager";
import { generateFileDiff, FileDiffOperation } from "./diffUtils";
import { mcpFactory } from "../../../mcp-clients/mcp-factory";

interface CommandResult {
  success: boolean;
  message: string;
  contextSummary: string;
  fileDiff?: FileDiffOperation;
}

export async function runUserCommand(
  agent: AnthropicClient,
  input: string,
  onProgress: (message: string) => void,
  onFileDiffUpdate?: (diff: FileDiffOperation | undefined) => void,
): Promise<CommandResult> {
  try {
    onProgress("Planning next steps...");
    contextManager.resetContext();

    while (true) {
      const context = contextManager.getContext();
      const action = await chooseNextAction(agent, input, context);

      if (!action) {
        return {
          success: true,
          message: "All tasks completed",
          contextSummary: contextManager.getContextSummary(),
        };
      }

      // Execute multiple actions
      if (Array.isArray(action)) {
        onProgress(`Running ${action.length} actions`);
        let allSuccessful = true;

        let fileDiff: FileDiffOperation | undefined;

        for (const singleAction of action) {
          const actionWithDefaults = {
            ...singleAction,
            systemPrompt: singleAction.systemPrompt || "",
            updateFileDiff: onFileDiffUpdate, // Pass the function to clear diff after confirmation
          };

          onProgress(`Running: ${singleAction.name}`);
          const result = await executeWithConfirmation(
            agent,
            actionWithDefaults,
          );

          // Generate file diff for file operations
          if (
            (result.toolName === "write_file" ||
              result.toolName === "edit_file") &&
            singleAction.code
          ) {
            const diffType =
              result.toolName === "write_file" ? "create" : "edit";
            fileDiff = generateFileDiff(
              diffType,
              singleAction.filePath,
              singleAction.code,
            );

            const edits = [];
            edits.forEach((edit) => {
              const confirm = confirmGitDiff();
              if (confirm) {
                mcpFactory
                  .getClient("filesystem")
                  ?.callTool("edit_file", { dry_run: false, edits: [edit] });
              }
            });

            // Update file diff in real-time
            if (onFileDiffUpdate) {
              onFileDiffUpdate(fileDiff);
            }
          }

          if (result.message) {
            contextManager.setLastActionResult(result.success, result.message);
          }

          contextManager.updateFromResponse(result.context);

          if (!result.success) {
            allSuccessful = false;
            break;
          }
        }

        // Instead of returning after batch completion, continue the main loop
        // Only return if some action failed
        if (!allSuccessful) {
          return {
            success: false,
            message: "Some actions failed",
            contextSummary: contextManager.getContextSummary(),
            fileDiff,
          };
        }

        // Otherwise continue processing more actions
        onProgress("Completed batch actions, continuing with next actions...");
      }
      // Execute single action
      else {
        const actionWithDefaults = {
          ...action,
          systemPrompt: action.systemPrompt || "",
          updateFileDiff: onFileDiffUpdate, // Pass the function to clear diff after confirmation
        };

        onProgress(`Running: ${action.name}`);
        const result = await executeWithConfirmation(agent, actionWithDefaults);

        console.log("result", result);

        // Generate file diff for file operations
        let fileDiff: FileDiffOperation | undefined;
        if (
          (result.toolName === "write_file" ||
            result.toolName === "edit_file") &&
          action.code
        ) {
          const diffType = result.toolName === "write_file" ? "create" : "edit";
          fileDiff = generateFileDiff(diffType, action.filePath, action.code);

          if (onFileDiffUpdate) {
            onFileDiffUpdate(fileDiff);
          }
        }

        if (result.message) {
          contextManager.setLastActionResult(result.success, result.message);
        }

        contextManager.updateFromResponse(result.context);

        if (!result.success) {
          return {
            success: false,
            message: "Action failed",
            contextSummary: contextManager.getContextSummary(),
            fileDiff,
          };
        }

        // If the action was successful, continue the loop to process more actions
        onProgress("Completed action, continuing with next actions...");
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: `Error: ${errorMessage}`,
      contextSummary: contextManager.getContextSummary(),
      fileDiff: undefined,
    };
  }
}
