import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ClientName } from "./calculator-mcp-client";

export class McpClient {
  name: ClientName;
  client: Client;

  constructor(name: ClientName, client: Client) {
    this.name = name;
    this.client = client;
  }

  getName(): ClientName {
    return this.name;
  }

  listTools(): ReturnType<typeof this.client.listTools> {
    return this.client.listTools();
  }

  listResources(): ReturnType<typeof this.client.listResources> {
    return this.client.listResources();
  }

  callTool(name: string, args: any): Promise<any> {
    return this.client.callTool({
      name,
      arguments: args,
    });
  }

  readResource(uri: string): Promise<any> {
    return this.client.readResource({ uri });
  }
}

// export type MethodName = "console-errors" | "network-errors";

// export type BrowserError = {
//   message: string;
//   stack: string;
// };

// type NetworkError = {
//   message: string;
//   type: string;
// };

// type MethodResponse = {
//   "console-errors": BrowserError[];
//   "network-errors": NetworkError[];
// };

// export type McpResponse<T extends MethodName> = {
//   result: MethodResponse[T];
// };

// export class McpClient {
//   async sendRequest<T extends MethodName>(method: T): Promise<McpResponse<T>> {
//     return {
//       result: [],
//     };
//   }
// }
