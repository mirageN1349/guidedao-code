import { render } from "ink";
import { setupAgent } from "./agent";
import { codebaseManager } from "./managers/codebaseManager";
import Welcome from "./modules/cli/ui/Welcome";
import { startCLI } from "./modules/cli/cli";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent();

  const { clear } = render(<Welcome isScanning={true} isReady={false} />);

  await codebaseManager.scanCodebase(projectPath);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  clear();

  startCLI(agent);
};
