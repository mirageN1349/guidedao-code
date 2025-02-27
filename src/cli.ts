import readline from "readline";
import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";

export const startCLI = (agent: AgentRuntime, currentProjectPath: string) => {
  const rl = createCLIInterface();

  rl.on("line", async (input) => {
    console.log(`Received input: ${input}`);

    console.log(chalk.cyan("Processing..."));

    const res = await generateText({
      runtime: agent,
      context: input,
      modelClass: ModelClass.SMALL,
    });

    console.log(chalk.cyan(res));
  });
};

const createCLIInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
};
