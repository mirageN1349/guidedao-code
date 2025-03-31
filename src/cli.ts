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
  });
};

// CLI интерфейс с упрощенной реализацией ввода
const createCLIInterface = () => {
  // Состояние терминала
  const terminal = {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };

  // Создаем readline интерфейс
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Храним текущее значение ввода и позицию курсора
  let currentInput = "";
  let cursorPos = 0;
  let history: any[] = [];
  let historyIndex = -1;

  // Включаем режим обработки клавиш
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  readline.emitKeypressEvents(process.stdin);

  // Переопределяем стандартный обработчик readline
  (rl as any)._ttyWrite = function () {};

  // Переопределяем prompt с улучшенной поддержкой мультилайн и визуальным курсором
  rl.prompt = () => {
    console.clear();
    console.log(chalk.cyan.bold("GuideDAO Code CLI"));

    // Форматируем ввод для правильного отображения многострочных вводов
    let input = currentInput || "";

    // Добавляем визуальный курсор в текст на правильной позиции
    const visualCursor = chalk.inverse(input.charAt(cursorPos) || " ");

    // Разделяем строку ввода на части до и после курсора
    const beforeCursor = input.substring(0, cursorPos);
    const afterCursor = input.substring(cursorPos + 1);

    // Создаем визуальное представление текста с курсором
    const visualInput = beforeCursor + visualCursor + afterCursor;

    // Проверяем, есть ли переносы строк
    const hasMultipleLines = visualInput.includes("\n");

    // Если есть переносы строк, меняем стиль отображения
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

    // Префикс для текста
    const prefix = hasMultipleLines ? "< (многострочный ввод)\n" : "< ";

    // Добавляем отступы для многострочного ввода
    let displayText = visualInput;
    if (hasMultipleLines) {
      displayText = visualInput.split("\n").join("\n  ");
    }

    // Рисуем boxen с текущим вводом и визуальным курсором
    console.log(boxen(prefix + displayText, boxOptions));

    // Информация о комбинациях клавиш
    console.log(
      chalk.dim(
        "Enter: отправить | Shift+Enter: новая строка | Esc: очистить | ←→: перемещение | ↑↓: история",
      ),
    );

    return rl;
  };

  // Обработчик клавиш с поддержкой мультилайн и дополнительных команд
  process.stdin.on("keypress", (char, key) => {
    if (!key) return;

    // Ctrl+C - выход
    if (key.ctrl && key.name === "c") {
      process.exit(0);
    }

    // Shift+Enter или Ctrl+Enter - добавление новой строки
    if (key.name === "return" && (key.shift || key.ctrl)) {
      // Вставляем перенос строки на позиции курсора
      currentInput =
        currentInput.substring(0, cursorPos) +
        "\n" +
        currentInput.substring(cursorPos);
      cursorPos++;
      rl.prompt();
      return;
    }

    // Enter без модификаторов - отправка ввода
    if (key.name === "return") {
      console.log(); // Печатаем перевод строки для визуального разделения

      // Сохраняем команду в историю, если она не пустая
      if (currentInput.trim()) {
        history.push(currentInput);
        historyIndex = history.length;
      }

      // Отправляем текущий ввод в readline
      const input = currentInput;
      currentInput = "";
      cursorPos = 0;

      // Эмитим событие line для обработки ввода
      rl.emit("line", input);
      return;
    }

    // Навигация по тексту
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

    // Навигация по истории
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

    // Home и End
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

    // Tab - автодополнение (в будущем)
    if (key.name === "tab") {
      // Здесь можно добавить логику автодополнения
      return;
    }

    // Ctrl+L - очистка экрана
    if (key.ctrl && key.name === "l") {
      rl.prompt();
      return;
    }

    // Backspace - удаление символа перед курсором
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

    // Delete - удаление символа после курсора
    if (key.name === "delete") {
      if (cursorPos < currentInput.length) {
        currentInput =
          currentInput.substring(0, cursorPos) +
          currentInput.substring(cursorPos + 1);
        rl.prompt();
      }
      return;
    }

    // Escape - очистка ввода
    if (key.name === "escape") {
      currentInput = "";
      cursorPos = 0;
      rl.prompt();
      return;
    }

    // Обычные символы - добавляем в текущий ввод на позиции курсора
    if (char && !key.ctrl && !key.meta) {
      currentInput =
        currentInput.substring(0, cursorPos) +
        char +
        currentInput.substring(cursorPos);
      cursorPos++;
      rl.prompt();
    }
  });

  // Обновляем интерфейс при изменении размера терминала
  process.stdout.on("resize", () => {
    terminal.width = process.stdout.columns || 80;
    terminal.height = process.stdout.rows || 24;
    rl.prompt();
  });

  // Начальный вывод prompt
  rl.prompt();

  return rl;
};
