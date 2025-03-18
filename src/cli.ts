import readline from "readline";
import ora from "ora";

import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import { executeWithConfirmation } from "./actionManager";
import { makeActionsList } from "./llm/makeActionsList";

export const startCLI = (agent: AgentRuntime) => {
  const rl = createCLIInterface();

  rl.on("line", async (userInput) => {
    if (!userInput) return;

    const spinner = ora("Processing user input...").start();

    const actions = await makeActionsList(agent, userInput);

    spinner.stop();

    console.log("ACTIONS: ", actions);

    for await (const action of actions) {
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
