export type ActionName =
  | "EDIT_FILE"
  | "CREATE_FILE"
  | "DELETE_FILE"
  | "MOVE_FILE"
  | "FIX_BROWSER_ERRORS"
  | "READ_FILE";

// Define structured context types
export type FileOperation = {
  type: "read" | "edit" | "create" | "delete" | "move";
  filePath: string;
  description: string;
  timestamp: number;
};

export type ActionContext = {
  // File operations history
  fileOperations: FileOperation[];
  // Last action result
  lastActionResult?: {
    success: boolean;
    message: string;
  };
  // Notes and additional information about the context
  notes: string[];
};

export type LLMAction = {
  name: ActionName;
  filePath: string;
  prompt: string;
  systemPrompt: string;
  context: ActionContext;
  // Field to store generated content
  code?: string;
};

export type HandlerResponse = {
  context: ActionContext;
  success: boolean;
  message?: string;
};
