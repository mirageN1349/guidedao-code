import { AgentRuntime } from "@elizaos/core";
import { setupAgent } from "./agent";
import { startCLI } from "./cli";

export const setupCodeAssistant = (projectPath: string) => {
  // const codebase = scanCodebase(process.cwd()) // users/me/code/test/
  const agent = setupAgent("");

  startCLI(agent, projectPath);
};
