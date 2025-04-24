import { calculatorMcpClient, ClientName } from "./calculator-mcp-client";
import { McpClient } from "./mcp-client";

export type McpRequest = {
  clientName: ClientName;
  operation: "callTool" | "readResource";
  params: {
    name: string;
    arguments: Record<string, unknown>;
    uri: string;
  };
};

const clients = [calculatorMcpClient];

export class McpFactory {
  private clients: Map<ClientName, McpClient> = new Map();

  constructor() {
    clients.forEach((client) => this.clients.set(client.name, client));
  }

  getClient(clientName: ClientName): McpClient | undefined {
    return this.clients.get(clientName);
  }

  getClients(): McpClient[] {
    return Array.from(this.clients.values());
  }

  async call(request: McpRequest) {
    const { clientName, operation, params } = request;
    const client = this.clients.get(clientName);

    if (!client) {
      throw new Error(`Client ${clientName} not found`);
    }

    if (operation === "callTool") {
      return await client.callTool(params.name, params.arguments);
    } else if (operation === "readResource") {
      return await client.readResource(params.uri);
    }
  }
}

export const mcpFactory = new McpFactory();

// {
//   clientName:  '',
//   operation: 'callTool' |  'readResource',
//   params:  {
//     a :1 ,
//     b:2,
//   },

// }
