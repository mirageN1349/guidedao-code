import readline from "readline";
import ora from "ora";
import inquirer from "inquirer";

import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import { chooseNextAction } from "./llm/makeActionsList";
import { executeWithConfirmation } from "./managers/actionManager";
import { contextManager } from "./managers/contextManager";

export const startCLI = (agent: AgentRuntime) => {
  const rl = createCLIInterface();

  rl.on("line", async (userInput) => {
    if (!userInput || userInput.toLowerCase() === "no") return;

    contextManager.resetContext();
    let executionComplete = false;

    while (!executionComplete) {
      const spinner = ora("Thinking...").start();
      const currentContext = contextManager.getContext();

      const nextAction = await chooseNextAction(
        agent,
        userInput,
        currentContext,
      );

      spinner.stop();

      if (!nextAction) {
        console.log(chalk.green("✅ All actions completed successfully."));
        console.log(chalk.dim(contextManager.getContextSummary()));
        executionComplete = true;
        continue;
      }

      const actionToExecute = {
        ...nextAction,
        systemPrompt: nextAction.systemPrompt || "",
      };

      const res = await executeWithConfirmation(agent, actionToExecute);

      if (res.message) {
        contextManager.setLastActionResult(res.success, res.message);
      }

      contextManager.updateFromResponse(res.context);

      if (!res.success) {
        const { continueExecution } = await inquirer.prompt([
          {
            type: "confirm",
            name: "continueExecution",
            message:
              "Action failed. Do you want to continue with the next action?",
            default: true,
          },
        ]);

        if (!continueExecution) {
          console.log(chalk.yellow("⚠️ Execution stopped by user."));
          console.log(chalk.dim(contextManager.getContextSummary()));
          executionComplete = true;
        }
      }
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
