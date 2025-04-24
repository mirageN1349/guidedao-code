import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpClient } from "./mcp-client";

const transport = new StdioClientTransport({
  command: "node",
  args: ["src/mcp-servers/calculator.js"],
});

const client = new Client({
  name: "example-client",
  version: "1.0.0",
});

await client.connect(transport);

export const calculatorMcpClient = new McpClient("calculator", client);

// const result = await client.callTool({
//   name: "calculate",
//   arguments: {
//     a: 4,
//     b: 2,
//   },
// });

// const resource = await client.readResource({ uri: "greeting://Vanya" });
// const resource2 = await client.readResource({ uri: "file:///README.md" });
// const resource3 = await client.readResource({
//   uri:
//     "web://" +
//     encodeURIComponent(
//       "https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients",
//     ),
// });

// console.log("resource: ", resource.contents);
// console.log("resource2: ", resource2.contents);
// console.log("resource3: ", resource3.contents);

// transport.send({
//   jsonrpc: "2.0",
//   method: "tool/calculate",
//   params: {
//     arguments: {
//       a: 4,
//       b: 2,
//     },
//   },
// });

// console.log("result:", result);
