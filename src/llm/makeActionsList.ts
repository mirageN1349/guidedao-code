import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import { ActionContext, LLMAction } from "../actions/types";
import { contextManager } from "../managers/contextManager";
import { actions } from "../managers/actionManager";
import { codebase } from "../managers/codebaseManager";

export const chooseNextAction = async (
  agent: AgentRuntime,
  userPrompt: string,
  context: ActionContext,
): Promise<LLMAction | null> => {
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
    2. READ_FILE actions are executed without user confirmation, so use them freely to understand the code
    3. For complex tasks that involve multiple files, read all relevant files before making any changes
    4. If a file uses imports or depends on other modules, ALWAYS examine those imported files first:
       - Identify all import statements in the file you're working with
       - Use READ_FILE actions to read the imported files if they might be relevant to the problem
       - Include the content of these imported files in your analysis when generating your solution
       - This is especially important when the imported files contain types, interfaces, or utility functions
    5. After reading a file, determine the appropriate next action based on its content and the user's request
    6. NEVER read or modify the following files:
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

    CRITICAL FORMATTING REQUIREMENTS:
    - You MUST return ONLY the required JSON structure with no other text
    - DO NOT include any explanations, notes, or comments outside the JSON
    - Include ALL reasoning and explanations within the 'prompt' field of the action
    - If you need to add context, notes, or explanations about your thought process, include them in the 'prompt' field

    Based on the user's request, the current context, and the execution plan, determine the NEXT action to take.
    If all necessary actions have been completed, return null.

    Return EXACTLY ONE of these JSON structures, and NOTHING ELSE:
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

    Or if all actions are completed:
    {
      "action": null
    }

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

/**
 * Gets a list of actions to execute for a given prompt
 */
export const makeActionsList = async (
  agent: AgentRuntime,
  prompt: string,
  role?: "system" | "user",
): Promise<LLMAction[]> => {
  // Reset the context manager for a fresh start
  contextManager.resetContext();

  // Get the first action
  const firstAction = await chooseNextAction(
    agent,
    prompt,
    contextManager.getContext(),
  );
  if (!firstAction) return [];

  const actions: LLMAction[] = [firstAction];

  // Update context for the first action
  contextManager.addFileOperation(
    "read",
    firstAction.filePath,
    `Executed action: ${firstAction.name}`,
  );

  // Request subsequent actions until the LLM returns null
  let nextAction = await chooseNextAction(
    agent,
    prompt,
    contextManager.getContext(),
  );
  while (nextAction) {
    actions.push(nextAction);

    // Update context for each action
    contextManager.addFileOperation(
      "read",
      nextAction.filePath,
      `Executed action: ${nextAction.name}`,
    );

    nextAction = await chooseNextAction(
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
