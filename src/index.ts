import { setupAgent } from "./agent";
import { startCLI } from "./cli";
import { scanCodebase } from "./scanner";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent("new agent");

  const codebase = await scanCodebase(projectPath);

  startCLI(agent, codebase);
};
