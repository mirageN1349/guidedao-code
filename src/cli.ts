import readline from "readline";
import ora from "ora";

import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import { makeActionsList } from "./llm/makeActionsList";
import { executeWithConfirmation } from "./managers/actionManager";

export const startCLI = (agent: AgentRuntime) => {
  const rl = createCLIInterface();

  rl.on("line", async (userInput) => {
    if (!userInput) return;

    console.log("userInput: ", userInput);
    const spinner = ora("Processing user input...").start();

    const actions = await makeActionsList(agent, userInput);

    spinner.stop();

    console.log("ACTIONS: ", actions);

    let context = "";
    for await (const action of actions) {
      const res = await executeWithConfirmation(agent, { ...action, context });
      context += res.context;
    }
  });
};

const createCLIInterface = () => {
  const terminal = {
    width: process.stdout.columns || 80,
  };

  const promptText = "guidedao-code> ";
  const borderTop = "╭" + "─".repeat(terminal.width - 100) + "╮";
  const borderBottom = "╰" + "─".repeat(terminal.width - 100) + "╯";

  console.log(chalk.magenta(borderTop));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.magenta("│ ") + chalk.bold.magenta(promptText),
  });

  const oldPrompt = rl.prompt.bind(rl);
  rl.prompt = (...args) => {
    console.log(chalk.magenta(borderBottom));
    console.log(chalk.magenta(borderTop));
    oldPrompt(...args);
  };

  return rl;
};
