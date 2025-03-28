export type ActionName =
  | "EDIT_FILE"
  | "CREATE_FILE"
  | "DELETE_FILE"
  | "MOVE_FILE"
  | "EXPLAIN_FILE"
  | "FIX_BROWSER_ERRORS"
  | "REFACTOR_CODE";

export type LLMAction = {
  name: ActionName;
  filePath: string;
  prompt: string;
  systemPrompt: string;
  context: string;
};

export type HandlerResponse = {
  context: string;
  success: boolean;
};