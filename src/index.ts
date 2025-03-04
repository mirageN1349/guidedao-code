import { AgentRuntime } from "@elizaos/core";
import { setupAgent } from "./agent";
import { startCLI } from "./cli";
import { scanCodebase } from "./scanner";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent("");

  const codebase = await scanCodebase(projectPath);

  startCLI(agent, codebase);
};
