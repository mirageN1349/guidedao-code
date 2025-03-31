import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import { ActionContext, LLMAction, LLMResponse } from "../actions/types";
import { contextManager } from "../managers/contextManager";
import { actions } from "../managers/actionManager";
import { codebase } from "../managers/codebaseManager";

export const chooseNextAction = async (
  agent: AgentRuntime,
  userPrompt: string,
  context: ActionContext,
): Promise<LLMResponse | null> => {
  const jsonCodebase = JSON.stringify(codebase);
  const actionsList = actions.map((action) => action.name).join(", ");

  if (!context) {
    context = {
      fileOperations: [],
      notes: [],
    };
  }

  const formattedContext = contextManager.formatContextForLLM();

  const systemPrompt = `
    You are an assistant for code generation and code editing. You have access to a codebase and a set of possible actions.

    Codebase information (files and directories structure): ${jsonCodebase}

    Available actions: ${actionsList}

    User request: ${userPrompt}

    Current context of what has been done so far:
    ${formattedContext}

    THINKING PROCESS:
    1. Understand what the user is asking you to do
    2. Analyze the current context to see what has already been done
    3. If this is a new request, start by exploring relevant files to understand the codebase first
    4. Determine what files need to be examined or modified based on the user request
    5. Think about the logical sequence of operations needed to fulfill the request

    IMPORTANT WORKFLOW RULES:
    1. Before editing, creating, moving, or deleting any file, ALWAYS first use READ_FILE action to examine its content
    2. When you need to find specific files or code patterns related to a task, use the SEARCH_FILES action first
       - Place search parameters in the 'code' field as JSON: {"pattern": "*.ts", "content": "function name"}
       - The 'pattern' parameter supports glob patterns (e.g., "**/*.ts" or "src/components/*.tsx")
       - The 'content' parameter searches inside files for specific text or code patterns
       - Example: for finding TypeScript files with an interface: code: {"pattern": "**/*.ts", "content": "interface User"}
    3. READ_FILE and SEARCH_FILES actions are executed without user confirmation, so use them freely to understand the code
    4. For complex tasks that involve multiple files, read all relevant files before making any changes
    5. If a file uses imports or depends on other modules, ALWAYS examine those imported files first:
       - Identify all import statements in the file you're working with
       - Use READ_FILE actions to read the imported files if they might be relevant to the problem
       - Include the content of these imported files in your analysis when generating your solution
       - This is especially important when the imported files contain types, interfaces, or utility functions
    6. After reading a file, determine the appropriate next action based on its content and the user's request
    7. NEVER read or modify the following files:
       - *lock.yml
       - package-lock.json
       - yarn.lock
       - pnpm-lock.yaml
       - .npmrc
       - .yarnrc
       - .pnpmrc
       - node_modules/**/*
    7. Before creating the next action, analyze if it has already been performed in previous actions
    8. Use the context information to inform your decisions about what to do next
    9. Think step by step about what actions need to be taken to complete the user's request
    10. When you need to read multiple files at once, consider returning an array of READ_FILE actions in a single response instead of sequential individual actions. This approach is more efficient and helps establish context faster.
    11. To avoid infinite loops, you MUST check if your suggested action has already been performed in the context. If you find yourself suggesting the same or similar actions repeatedly, it's a strong indication that the task is complete and you should return null.

    CRITICAL FORMATTING REQUIREMENTS:
    - You MUST return ONLY the required JSON structure with no other text
    - DO NOT include any explanations, notes, or comments outside the JSON
    - Include ALL reasoning and explanations within the 'prompt' field of the action
    - If you need to add context, notes, or explanations about your thought process, include them in the 'prompt' field

    Based on the user's request, the current context, and the execution plan, determine the NEXT action to take.
    
    IMPORTANT: If all necessary actions have been completed or if the task seems completed based on context, you MUST return null.
    This is critical to prevent infinite loops. Carefully examine the context to determine if the user's request has been fully addressed.
    If you believe the task is complete or no further actions are needed, return null.

    Return ONE of these JSON structures, and NOTHING ELSE:

    Single action format:
    {
      "action": {
        "name": "ACTION_NAME",
        "filePath": "path/to/file.ts",
        "prompt": "Detailed description of what should be done with this file. Include ANY additional notes or thoughts here.",
        "systemPrompt": "",
        "context": "",
        "code": "For CREATE_FILE and EDIT_FILE actions, provide the full code content of the file here. This should be the complete code without any explanations or markdown."
      }
    }

    Multiple actions format (useful for batching similar operations like multiple READ_FILE actions):
    {
      "action": [
        {
          "name": "ACTION_NAME",
          "filePath": "path/to/file1.ts",
          "prompt": "Detailed description of what should be done with file1.",
          "systemPrompt": "",
          "context": "",
          "code": "For CREATE_FILE and EDIT_FILE actions, provide the full code content here."
        },
        {
          "name": "ACTION_NAME",
          "filePath": "path/to/file2.ts",
          "prompt": "Detailed description of what should be done with file2.",
          "systemPrompt": "",
          "context": "",
          "code": "For CREATE_FILE and EDIT_FILE actions, provide the full code content here."
        }
        // Additional actions can be included here
      ]
    }

    Or if all actions are completed or the task seems finished based on context:
    {
      "action": null
    }
    
    REMEMBER: You MUST return {"action": null} when the task is completed or no further actions make sense.
    This prevents infinite loops and ensures efficient processing.

    IMPORTANT: For CREATE_FILE and EDIT_FILE actions:
    - You MUST include a 'code' field with the complete file content. This should be the final code, not just changes or explanations.
    - Before generating code, analyze all import statements and dependencies:
      1. Identify all imported modules, types, and utilities that the file depends on
      2. Make sure you've examined the content of these imported files through READ_FILE actions
      3. Ensure your generated code correctly uses any types, interfaces, or functions from these imports
      4. If you're adding new imports, verify that these modules exist in the codebase
    - Maintain consistent coding style with the rest of the codebase
  `;

  const res = await generateText({
    runtime: agent,
    context: systemPrompt,
    modelClass: ModelClass.LARGE,
  });

  try {
    let jsonStr = res;

    const jsonMatch = res.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsedRes = JSON.parse(jsonStr);

    if (!parsedRes || parsedRes.action === undefined) {
      console.error("LLM response missing action field. Raw response:", res);
      return null;
    }

    return parsedRes.action;
  } catch (error) {
    console.error(
      `Error parsing LLM response: ${(error as any).message}. Raw response:`,
      res,
    );

    return {
      name: "READ_FILE",
      filePath: "README.md",
      prompt:
        "Reading README.md file to understand codebase structure due to error in previous action generation",
      systemPrompt: "",
      context: {
        fileOperations: [],
        notes: [],
        lastActionResult: {
          message: "",
          success: true,
        },
      },
    };
  }
};

export const makeActionsList = async (
  agent: AgentRuntime,
  prompt: string,
  role?: "system" | "user",
): Promise<LLMAction[]> => {
  contextManager.resetContext();

  const firstResponse = await chooseNextAction(
    agent,
    prompt,
    contextManager.getContext(),
  );
  if (!firstResponse) return [];

  const actions: LLMAction[] = [];

  if (Array.isArray(firstResponse)) {
    actions.push(...firstResponse);

    firstResponse.forEach((action) => {
      contextManager.addFileOperation(
        "read",
        action.filePath,
        `Executed action: ${action.name}`,
      );
    });
  } else {
    actions.push(firstResponse);

    contextManager.addFileOperation(
      "read",
      firstResponse.filePath,
      `Executed action: ${firstResponse.name}`,
    );
  }

  let nextResponse = await chooseNextAction(
    agent,
    prompt,
    contextManager.getContext(),
  );

  while (nextResponse) {
    if (Array.isArray(nextResponse)) {
      actions.push(...nextResponse);

      nextResponse.forEach((action) => {
        contextManager.addFileOperation(
          "read",
          action.filePath,
          `Executed action: ${action.name}`,
        );
      });
    } else {
      actions.push(nextResponse);

      contextManager.addFileOperation(
        "read",
        nextResponse.filePath,
        `Executed action: ${nextResponse.name}`,
      );
    }

    nextResponse = await chooseNextAction(
      agent,
      prompt,
      contextManager.getContext(),
    );
  }

  return actions;
};

// улучшить systemPrompt
// Продумать систему подтверждений событий
// Доработать систему модификации cобытий
// Добавить MCP для браузера и для фигмы
// добавить MCP Server RAG + supabase + Obsidian
// интергация с github MCP
