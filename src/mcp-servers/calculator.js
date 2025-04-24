import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

server.tool(
  "calculate",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  }),
);

server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", () => {}),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  }),
);

server.resource(
  "file",
  new ResourceTemplate("file:///{fileName}", () => {}),
  async (uri, { fileName }) => ({
    contents: [
      {
        uri: uri.href,
        text: `File readed ${fileName}!`,
      },
    ],
  }),
);

server.resource(
  "web",
  new ResourceTemplate("web://{url}", () => {}),
  async (uri, { url }) => {
    const response = await fetch(decodeURIComponent(url));
    const text = await response.text();

    return {
      contents: [
        {
          uri: uri.href,
          text: `URL readed ${text}!`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();

// transport.send({
//   jsonrpc: "2.0",
//   method: "calculate",
//   result: { type: "text", text: "5" },
// });

await server.connect(transport);

// JSON-RPC 2.0 - используем для передачи данных между клиентом llm  и  сервером
// Zod - используем для валидации данных от llm
// Transport  stdio -  используется для  взаимодействия клиента и сервера в рамках CLI инструментов, когда нам не выгодно использовать http
// transport SSE -

//  JSON-RPC -> http/ws -> TCP
//  SSE -> http -> TCP
//
// User Input -> LLM -> LLM  call Tool Figma JSON RPC ({}) -> MCP Client  call tool ->  Server response  to cleint ->  LLM Context -> LLM Generate with Figma Context
