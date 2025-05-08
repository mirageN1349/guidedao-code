import React from "react";
import { render } from "ink";
import { AgentRuntime } from "@elizaos/core";
import App from "./ui/App";

export const startCLI = (agent: AgentRuntime) => {
  const { waitUntilExit } = render(<App agent={agent} />);
  return waitUntilExit();
};
