import readline from "readline";
import ora from "ora";

import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import { Codebase } from "./scanner";
import {
  LLMAction,
  actions,
  editFileAction,
  executeWithConfirmation,
} from "./actionManager";

export const startCLI = (agent: AgentRuntime, codebase: Codebase) => {
  const rl = createCLIInterface();

  rl.on("line", async (userInput) => {
    if (!userInput) return;

    console.log(`Received input: ${userInput}`);

    const spinner = ora("Processing user input...").start();

    const jsonCodebase = JSON.stringify(codebase);
    const actionsList = actions.map((action) => action.name).join(", ");
    const systemPrompt = `
    You are an assistant for code generation and code editing. You have access to a codebase and a set of possible actions.

    Codebase information: ${jsonCodebase}

    Available actions: ${actionsList}

    User request: ${userInput}

    Based on the user's request, determine the necessary changes to make to the codebase.
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
      modelClass: ModelClass.SMALL,
    });

    const parsedRes: { actions: LLMAction[] } = JSON.parse(res);

    spinner.stop();

    console.log("ACTIONS: ", parsedRes.actions);

    for await (const action of parsedRes.actions) {
      await executeWithConfirmation(agent, action);
    }
  });
};

const createCLIInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.magenta("guidedao-code> "),
  });
};
