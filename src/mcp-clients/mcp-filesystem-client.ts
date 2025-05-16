import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpClient } from "./mcp-client";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
});

const client = new Client({
  name: "filesystem-client",
  version: "1.0.0",
});

await client.connect(transport);

export const filesystemMcpClient = new McpClient("filesystem", client);
