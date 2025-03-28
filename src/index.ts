import { setupAgent } from "./agent";
import { startCLI } from "./cli";
import { codebaseManager } from "./managers/codebaseManager";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent();
  await codebaseManager.scanCodebase(projectPath);

  startCLI(agent);
};
