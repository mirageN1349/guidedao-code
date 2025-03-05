import { AgentRuntime } from "@elizaos/core";
import { setupAgent } from "./agent.js";
import { startCLI } from "./cli.js";
import { scanCodebase } from "./scanner.js";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent("");

  const codebase = await scanCodebase(projectPath);

  startCLI(agent, codebase);
};
