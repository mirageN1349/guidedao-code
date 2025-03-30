import readline from "readline";
import ora from "ora";
import inquirer from "inquirer";
import boxen from "boxen";

import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import { chooseNextAction } from "./llm/makeActionsList";
import { executeWithConfirmation } from "./managers/actionManager";
import { contextManager } from "./managers/contextManager";

let outputBuffer: any[] = [];
const maxBufferSize = 20;

export const startCLI = (agent: AgentRuntime) => {
  const rl = createCLIInterface();

  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);

    outputBuffer.push(args.join(" "));

    if (outputBuffer.length > maxBufferSize) {
      outputBuffer.shift();
    }
  };

  rl.on("line", async (userInput) => {
    if (!userInput || userInput.toLowerCase() === "n") {
      rl.prompt();
      return;
    }

    if (
      userInput.toLowerCase() === "exit" ||
      userInput.toLowerCase() === "quit"
    ) {
      console.log(chalk.yellow("Goodbye! Thanks for using GuideDAO Code."));
      process.exit(0);
    }

    if (userInput.toLowerCase() === "clear") {
      outputBuffer = [];
      rl.prompt();
      return;
    }

    console.log(
      "\n" +
        boxen(chalk.cyan.bold("Processing: ") + chalk.white(userInput), {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
        }) +
        "\n",
    );

    contextManager.resetContext();
    let executionComplete = false;

    while (!executionComplete) {
      const spinner = ora({
        text: "Thinking...",
        color: "cyan",
      }).start();

      const currentContext = contextManager.getContext();

      const nextAction = await chooseNextAction(
        agent,
        userInput,
        currentContext,
      );

      spinner.stop();

      if (!nextAction) {
        console.log(
          boxen(
            chalk.green("✅ All actions completed successfully.\n\n") +
              chalk.dim(contextManager.getContextSummary()),
            {
              padding: 1,
              borderStyle: "round",
              borderColor: "green",
            },
          ),
        );
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
          console.log(
            boxen(
              chalk.yellow("⚠️ Execution stopped by user.\n\n") +
                chalk.dim(contextManager.getContextSummary()),
              {
                padding: 1,
                borderStyle: "round",
                borderColor: "yellow",
              },
            ),
          );
          executionComplete = true;
        }
      }
    }

    rl.prompt();
  });

  rl.prompt();
};

const createCLIInterface = () => {
  const terminal = {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };

  const promptText = "✨ guidedao-code → ";

  const renderInputBox = () => {
    console.log(
      "\n" +
        boxen(chalk.cyan.bold("GUIDEDAO CODE ASSISTANT"), {
          padding: 1,
          margin: { top: 0, bottom: 1 },
          borderStyle: "double",
          borderColor: "cyan",
          textAlignment: "center",
        }),
    );
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.cyan.bold(promptText),
  });

  rl.prompt = (...args) => {
    console.clear();

    renderInputBox();

    const inputBox = boxen("", {
      padding: {
        top: 0,
        right: 1,
        bottom: 0,
        left: 1,
      },
      margin: {
        top: 0,
        bottom: 1,
        left: 3,
        right: 3,
      },
      borderStyle: "round",
      borderColor: "cyan",
      width: Math.min(terminal.width - 10, 80),
    });

    process.stdout.write(inputBox);

    process.stdout.write("\x1B[2A");

    process.stdout.write("\x1B[4C");

    process.stdout.write(chalk.cyan.bold(promptText));
  };

  process.stdout.on("resize", () => {
    terminal.width = process.stdout.columns || 80;
    terminal.height = process.stdout.rows || 24;
    rl.prompt();
  });

  rl.prompt();

  return rl;
};
