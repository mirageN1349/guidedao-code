import chalk from "chalk";
import figlet from "figlet";
import { setupAgent } from "./agent";
import { startCLI } from "./cli";
import { codebaseManager } from "./managers/codebaseManager";

const displayWelcomeBanner = () => {
  console.log("\n");
  console.log(
    chalk.cyan(
      figlet.textSync("GUIDEDAO CODE", {
        font: "ANSI Shadow",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 100,
      }),
    ),
  );

  console.log("\n");
  console.log(chalk.cyan.bold("✨ Your AI-powered coding companion ✨"));
  console.log("\n");
};

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent();

  displayWelcomeBanner();

  const scanningMessage = chalk.blue("🔍 Scanning codebase...");
  console.log(scanningMessage);

  await codebaseManager.scanCodebase(projectPath);

  console.log(chalk.green("✅ Ready to assist with your code!"));
  console.log("\n");

  startCLI(agent);
};
