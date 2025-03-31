import readline from "readline";
import ora from "ora";
import inquirer from "inquirer";
import boxen from "boxen";

import { AgentRuntime } from "@elizaos/core";
import chalk from "chalk";
import { chooseNextAction } from "./llm/makeActionsList";
import { executeWithConfirmation } from "./managers/actionManager";
import { contextManager } from "./managers/contextManager";

export const startCLI = (agent: AgentRuntime) => {
  const rl = createCLIInterface();

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

      const nextResponse = await chooseNextAction(
        agent,
        userInput,
        currentContext,
      );

      spinner.stop();

      if (!nextResponse) {
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

      if (Array.isArray(nextResponse)) {
        for (const action of nextResponse) {
          const actionToExecute = {
            ...action,
            systemPrompt: action.systemPrompt || "",
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
              break;
            }
          }
        }
      } else {
        const actionToExecute = {
          ...nextResponse,
          systemPrompt: nextResponse.systemPrompt || "",
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
    }
  });
};

const createCLIInterface = () => {
  const terminal = {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let currentInput = "";
  let cursorPos = 0;
  let history: any[] = [];
  let historyIndex = -1;

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  readline.emitKeypressEvents(process.stdin);

  (rl as any)._ttyWrite = function () {};

  rl.prompt = () => {
    console.clear();
    console.log(chalk.cyan.bold("GuideDAO Code CLI"));

    let input = currentInput || "";

    const visualCursor = chalk.inverse(input.charAt(cursorPos) || " ");

    const beforeCursor = input.substring(0, cursorPos);
    const afterCursor = input.substring(cursorPos + 1);

    const visualInput = beforeCursor + visualCursor + afterCursor;

    const hasMultipleLines = visualInput.includes("\n");

    const boxOptions = {
      padding: {
        top: 0,
        bottom: 0,
        left: 1,
        right: 1,
      },
      borderStyle: "round",
      borderColor: "blackBright",
      width: Math.min(terminal.width - 10, 100),
    } as const;

    const prefix = hasMultipleLines ? "> (многострочный ввод)\n" : "> ";

    let displayText = visualInput;
    if (hasMultipleLines) {
      displayText = visualInput.split("\n").join("\n  ");
    }

    console.log(boxen(prefix + displayText, boxOptions));

    console.log(
      chalk.dim(
        "Enter: отправить | Shift+Enter: новая строка | Esc: очистить | ←→: перемещение | ↑↓: история",
      ),
    );

    return rl;
  };

  process.stdin.on("keypress", (char, key) => {
    if (!key) return;

    if (key.ctrl && key.name === "c") {
      process.exit(0);
    }

    if (key.name === "return" && (key.shift || key.ctrl)) {
      currentInput =
        currentInput.substring(0, cursorPos) +
        "\n" +
        currentInput.substring(cursorPos);
      cursorPos++;
      rl.prompt();
      return;
    }

    if (key.name === "return") {
      console.log();

      if (currentInput.trim()) {
        history.push(currentInput);
        historyIndex = history.length;
      }

      const input = currentInput;
      currentInput = "";
      cursorPos = 0;

      rl.emit("line", input);
      return;
    }

    if (key.name === "left") {
      if (cursorPos > 0) {
        cursorPos--;
        rl.prompt();
      }
      return;
    }

    if (key.name === "right") {
      if (cursorPos < currentInput.length) {
        cursorPos++;
        rl.prompt();
      }
      return;
    }

    if (key.name === "up") {
      if (historyIndex > 0) {
        historyIndex--;
        currentInput = history[historyIndex];
        cursorPos = currentInput.length;
        rl.prompt();
      }
      return;
    }

    if (key.name === "down") {
      if (historyIndex < history.length) {
        historyIndex++;
        currentInput =
          historyIndex === history.length ? "" : history[historyIndex];
        cursorPos = currentInput.length;
        rl.prompt();
      }
      return;
    }

    if (key.name === "home") {
      cursorPos = 0;
      rl.prompt();
      return;
    }

    if (key.name === "end") {
      cursorPos = currentInput.length;
      rl.prompt();
      return;
    }

    if (key.name === "tab") {
      return;
    }

    if (key.ctrl && key.name === "l") {
      rl.prompt();
      return;
    }

    if (key.name === "backspace") {
      if (cursorPos > 0) {
        currentInput =
          currentInput.substring(0, cursorPos - 1) +
          currentInput.substring(cursorPos);
        cursorPos--;
        rl.prompt();
      }
      return;
    }

    if (key.name === "delete") {
      if (cursorPos < currentInput.length) {
        currentInput =
          currentInput.substring(0, cursorPos) +
          currentInput.substring(cursorPos + 1);
        rl.prompt();
      }
      return;
    }

    if (key.name === "escape") {
      currentInput = "";
      cursorPos = 0;
      rl.prompt();
      return;
    }

    if (char && !key.ctrl && !key.meta) {
      currentInput =
        currentInput.substring(0, cursorPos) +
        char +
        currentInput.substring(cursorPos);
      cursorPos++;
      rl.prompt();
    }
  });

  process.stdout.on("resize", () => {
    terminal.width = process.stdout.columns || 80;
    terminal.height = process.stdout.rows || 24;
    rl.prompt();
  });

  rl.prompt();

  return rl;
};
