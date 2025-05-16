import { McpRequest } from "../mcp-clients/mcp-factory";

export type ActionName = "CALL_MCP";
// | "EDIT_FILE"
// | "CREATE_FILE"
// | "DELETE_FILE"
// | "MOVE_FILE"
// | "FIX_BROWSER_ERRORS"
// | "READ_FILE"
// | "SEARCH_FILES"

export type OperationType =
  | "read"
  | "edit"
  | "create"
  | "delete"
  | "move"
  | "search"
  | "call_mcp";

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
  code?: string;
  mcpRequestParams?: McpRequest;
  updateFileDiff?: (diff: any) => void;
};

// Тип для поддержки как одиночных действий, так и массивов действий
export type LLMResponse = LLMAction | LLMAction[];

export type HandlerResponse = {
  context: ActionContext;
  success: boolean;
  message?: string;
  toolName?: string;
};
