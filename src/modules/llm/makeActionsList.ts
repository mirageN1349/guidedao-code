import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import { ActionContext, LLMResponse } from "../../actions/types";
import { contextManager } from "../../managers/contextManager";
import { actions } from "../../managers/actionManager";
import { codebase } from "../../managers/codebaseManager";
import { mcpFactory } from "../../mcp-clients/mcp-factory";

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

  let mcpContext = "";

  const getMcpContext = async () => {
    try {
      const availableClients = mcpFactory.getClients();
      for (const client of availableClients) {
        if (client) {
          const tools = await client.listTools();
          // const resources = await client.listResources();
          mcpContext += `
            MCP Client: ${client.name}
            Available Tools: ${JSON.stringify(tools)}
          `;
          // Available Resources: ${JSON.stringify(resources || {})} ^
        }
      }
    } catch (error) {
      mcpContext = `Error fetching MCP clients information: ${(error as Error).message}`;
    }
  };

  await getMcpContext();

  const formattedContext = contextManager.getOptimzedContext();
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
    12. CRITICAL: NEVER use APIs, functions, or methods that you haven't explicitly verified exist in the codebase. Follow these steps before using any API:
       - First use SEARCH_FILES action to find where the API is defined or imported
       - Then use READ_FILE to examine the API implementation
       - Only after confirming the API exists and understanding how it works should you use it
       - If you can't find the API in the codebase, DO NOT assume it exists or try to use it

    MCP (Model Context Protocol) INSTRUCTIONS:
    You have access to MCP servers through the mcpFactory. Here are the available clients and their capabilities:
    ${mcpContext}

    To use an MCP client, you need to create a request in the following format:
    {
      "mcpRequestParams": {
        "clientName": "The name of the MCP client to use",
        "operation": "callTool" or "readResource",
        "params": {
          "name": "Name of the tool to call (for callTool operation)",
          "arguments": { key1: value1, key2: value2, ... }, // Arguments for the tool
          "uri": "URI of the resource to read (for readResource operation)"
        }
      }
    }

    Based on the available tools and resources listed above, you can:
    1. Call tools using the "callTool" operation by specifying the tool name and required arguments
    2. Read resources using the "readResource" operation by specifying the resource URI

    IMPORTANT: Only use tools and resources that are actually available in the MCP clients listed above.
    Before calling a tool or reading a resource, check if it exists in the available tools or resources.

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
        "code": "For CREATE_FILE and EDIT_FILE actions, provide the full code content of the file here. This should be the complete code without any explanations or markdown.",
        "mcpRequestParams": {
          "clientName": "The name of the MCP client to use",
          "operation": "callTool" or "readResource",
          "params": {
            "name": "Name of the tool to call (for callTool operation)",
            "arguments": {}, // Arguments for the tool
            "uri": "URI of the resource to read (for readResource operation)"
          }
        }
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
          "code": "For CREATE_FILE and EDIT_FILE actions, provide the full code content here.",
          "mcpRequestParams": {
            "clientName": "The name of the MCP client to use",
            "operation": "callTool" or "readResource",
            "params": {
              "name": "Name of the tool to call (for callTool operation)",
              "arguments": {}, // Arguments for the tool
              "uri": "URI of the resource to read (for readResource operation)"
            }
          }
        },
        {
          "name": "ACTION_NAME",
          "filePath": "path/to/file2.ts",
          "prompt": "Detailed description of what should be done with file2.",
          "systemPrompt": "",
          "context": "",
          "code": "For CREATE_FILE and EDIT_FILE actions, provide the full code content here.",
          "mcpRequestParams": {
            "clientName": "The name of the MCP client to use",
            "operation": "callTool" or "readResource",
            "params": {
              "name": "Name of the tool to call (for callTool operation)",
              "arguments": {}, // Arguments for the tool
              "uri": "URI of the resource to read (for readResource operation)"
            }
          }
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
      5. NEVER import or use modules, classes, functions, or APIs that you haven't explicitly verified exist in the codebase
      6. If you need to use a specific class, function, or API, first use SEARCH_FILES to locate it, then READ_FILE to examine it
    - Maintain consistent coding style with the rest of the codebase
    - When editing code that uses specific APIs or functions, always verify these functions exist and understand their parameters before using them
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

    console.log("mcpContext: ", mcpContext);

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

// улучшить systemPrompt
// Продумать систему подтверждений событий
// Доработать систему модификации cобытий
// Добавить MCP для браузера и для фигмы
// добавить MCP Server RAG + supabase + Obsidian
// интергация с github MCP
