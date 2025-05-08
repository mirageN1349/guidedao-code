import React from "react";
import { render } from "ink";
import { setupAgent } from "./agent";
import { codebaseManager } from "./managers/codebaseManager";
import Welcome from "./modules/cli/ui/Welcome";
import { startCLI } from "./modules/cli/cli";

export const setupCodeAssistant = async (projectPath: string) => {
  const agent = setupAgent();

  const { unmount } = render(<Welcome isScanning={true} isReady={false} />);

  await codebaseManager.scanCodebase(projectPath);
  unmount();

  const { unmount: unmountReady } = render(
    <Welcome isScanning={false} isReady={true} />,
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));
  unmountReady();

  startCLI(agent);
};
