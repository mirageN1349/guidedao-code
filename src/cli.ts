import readline from "readline";
import ora from "ora";

import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import { Codebase } from "./scanner.js";
import { LLMAction, actions, editFileAction } from "./actionManager.js";

export const startCLI = (agent: AgentRuntime, codebase: Codebase) => {
  const rl = createCLIInterface();



  rl.on("line", async (userInput) => {
    console.log(`Received input: ${userInput}`);

    ora('Processing...').start();

    const jsonCodebase = JSON.stringify(codebase);
    const actionsList = actions.map(action => action.name).join(", ");
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


    console.log(chalk.cyan(res));

    const parsedRes: { actions: LLMAction[] } = JSON.parse(res);

    for await (const action of parsedRes.actions) {
      if (action.name === 'EDIT_FILE') {
        await editFileAction.handler(agent, action)
      }
    }
  });
};

const createCLIInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.magenta("guidedao-code> ")
  });
};
