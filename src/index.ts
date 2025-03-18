import { setupAgent } from "./agent";
import { startCLI } from "./cli";
import { codebaseManager } from "./codebaseManager";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent("new agent");

  await codebaseManager.scanCodebase(projectPath);

  startCLI(agent);
};
