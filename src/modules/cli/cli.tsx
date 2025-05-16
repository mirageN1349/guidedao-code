import { render } from "ink";
import { AnthropicClient } from "../../anthropic-client";
import App from "./ui/App";

export const startCLI = (agent: AnthropicClient) => {
  const { waitUntilExit } = render(<App agent={agent} />);
  return waitUntilExit();
};
