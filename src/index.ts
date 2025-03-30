import chalk from "chalk";
import { setupAgent } from "./agent";
import { startCLI } from "./cli";
import { codebaseManager } from "./managers/codebaseManager";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent();
  await codebaseManager.scanCodebase(projectPath);

  console.log(chalk.blue("Starting GuideDAO Code"));

  startCLI(agent);
};
