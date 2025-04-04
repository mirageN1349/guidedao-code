export type ActionName =
  | "EDIT_FILE"
  | "CREATE_FILE"
  | "DELETE_FILE"
  | "MOVE_FILE"
  | "FIX_BROWSER_ERRORS"
  | "READ_FILE"
  | "SEARCH_FILES";

// Define structured context types
export type OperationType =
  | "read"
  | "edit"
  | "create"
  | "delete"
  | "move"
  | "search";

export type FileOperation = {
  type: OperationType;
  filePath: string;
  description: string;
  timestamp: number;
  tokensCount: number;
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
  notes: {
    content: string;
    tokensCount: number;
  }[];
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

// Тип для поддержки как одиночных действий, так и массивов действий
export type LLMResponse = LLMAction | LLMAction[];

export type HandlerResponse = {
  context: ActionContext;
  success: boolean;
  message?: string;
};
