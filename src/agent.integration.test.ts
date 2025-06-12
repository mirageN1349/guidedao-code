// user input => LLM => Action => MCP => Response
//

import { beforeEach, describe, expect, test, vi } from "vitest";
import { AnthropicClient } from "./anthropic-client";
import { mcpFactory } from "./mcp-clients/mcp-factory";
import { LLMAction } from "./actions/types";
import { executeWithConfirmation } from "./managers/actionManager";

vi.mock("./anthropic-client");
// все что експортируется из ./mcp-clients/mcp-factory будет заменено на stub (vi.fn())
vi.mock("./mcp-clients/mcp-factory");

describe("Integration: User input => LLM => Action => MCP => Response", () => {
  let mockAgent: AnthropicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAgent = new AnthropicClient({
      apiKey: "test-api-key",
      character: {
        adjectives: ["friendly", "helpful", "knowledgeable"],
        name: "Test Character",
        bio: "A helpful assistant",
        system: "You are a helpful assistant",
      },
      logging: true,
    });
  });

  test("should handle successful MCP flow", async () => {
    // Arrange
    const MCP_SERVER_NAME = "calculator";
    const mockMcpResponse = { result: 42 };
    const action: LLMAction = {
      name: "CALL_MCP",
      filePath: "",
      systemPrompt: "You are a helpful assistant",
      prompt: "Call the calculator tool to add 40 and 2",
      context: {
        fileOperations: [],
        notes: [],
      },
      mcpRequestParams: {
        clientName: MCP_SERVER_NAME,
        operation: "callTool",
        params: {
          arguments: {
            a: 40,
            b: 2,
          },
          name: "add",
          uri: "",
        },
      },
    };

    const llmTextResponse = JSON.stringify(action);

    vi.mocked(mcpFactory.call).mockResolvedValue(mockMcpResponse);
    vi.mocked(mockAgent.generateText).mockResolvedValue(llmTextResponse);

    // Act
    const firstAction = await mockAgent.generateText(
      "Call the calculator tool to add 40 and 2",
    );
    const result = await executeWithConfirmation(
      mockAgent,
      JSON.parse(firstAction),
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.context.notes).toHaveLength(1);
    expect(result.context.notes[0].content).toContain(MCP_SERVER_NAME);
    expect(result.context.notes[0].content).toContain(mockMcpResponse.result);
  });
});
