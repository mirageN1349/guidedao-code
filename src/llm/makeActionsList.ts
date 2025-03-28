import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import { LLMAction } from "../actions/types";
import { actions } from "../managers/actionManager";
import { codebase } from "../managers/codebaseManager";

export const makeActionsList = async (
  agent: AgentRuntime,
  prompt: string,
  role?: "system" | "user",
) => {
  const jsonCodebase = JSON.stringify(codebase);
  const actionsList = actions.map((action) => action.name).join(", ");
  const systemPrompt = `
  You are an assistant for code generation and code editing. You have access to a codebase and a set of possible actions.

  Codebase information: ${jsonCodebase}

  Available actions: ${actionsList}

  User request: ${prompt}

  Based on the user's request, determine the necessary changes to make to the codebase.
  Before every action run READ_FILE action
  Return ONLY a JSON array of actions to take in the exact format:
  {
    actions: [
      {
        "name": "${actionsList}",
        "filePath": "path/to/file.ts",
        "prompt": "Detailed description of what should be done with this file"
      }
    ]
  }
  `;

  const res = await generateText({
    runtime: agent,
    context: systemPrompt,
    modelClass: ModelClass.LARGE,
  });

  const parsedRes: { actions: LLMAction[] } = JSON.parse(res);

  return parsedRes.actions;
};

// улучшить systemPrompt
// Продумать систему подтверждений событий
// Доработать систему модификации cобытий
// Добавить MCP для браузера и для фигмы
// добавить MCP Server RAG + supabase + Obsidian
// интергация с github MCP
//
