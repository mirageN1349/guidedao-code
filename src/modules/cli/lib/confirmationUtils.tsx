import React from "react";
import { render, Box, useApp } from "ink";
import Confirmation, { ConfirmationOption } from "../ui/Confirmation";
import { FileDiffOperation, generateFileDiff } from "./diffUtils";

interface ConfirmationResult {
  confirmed: boolean;
  modifiedPrompt?: string;
}

export function createConfirmationPromise(
  message: string,
  actionPrompt?: string,
  fileDiff?: FileDiffOperation
): Promise<ConfirmationResult> {
  return new Promise((resolve) => {
    const options: ConfirmationOption[] = [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
      { label: "Modify", value: "modify" },
    ];

    const handleConfirm = (value: string, modifiedPrompt?: string) => {
      // Unmount the component when done
      if (app) {
        app.unmount();
        
        // Force stderr write to ensure UI updates
        process.stderr.write("\r\n");
        process.stderr.write('\x1B[?25h'); // Show cursor
      }

      if (value === "yes") {
        resolve({ confirmed: true });
      } else if (value === "modify" && modifiedPrompt) {
        resolve({ confirmed: true, modifiedPrompt });
      } else {
        resolve({ confirmed: false });
      }
    };

    const app = render(
      <Box>
        <Confirmation
          message={message}
          options={options}
          onConfirm={handleConfirm}
          actionPrompt={actionPrompt}
          showModify={!!actionPrompt}
          fileDiff={fileDiff}
        />
      </Box>
    );
  });
}

/**
 * Helper function to generate file diff for action confirmation
 */
export function generateActionDiff(
  actionName: string,
  filePath: string,
  code?: string
): FileDiffOperation | undefined {
  if (!code || !filePath) {
    return undefined;
  }

  if (actionName === "EDIT_FILE") {
    return generateFileDiff("edit", filePath, code);
  } else if (actionName === "CREATE_FILE") {
    return generateFileDiff("create", filePath, code);
  }

  return undefined;
}