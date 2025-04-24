import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { McpClient } from "./mcp-client";

const url = new URL("http://localhost:3333/sse");

const transport = new SSEClientTransport(url);

const client = new Client({
  name: "figma",
  version: "1.0.0",
});

await client.connect(transport);

export const figmaMcpClient = new McpClient("figma", client);
