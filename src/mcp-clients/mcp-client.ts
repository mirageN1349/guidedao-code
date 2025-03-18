export type MethodName = "console-errors" | "network-errors";

export type BrowserError = {
  message: string;
  stack: string;
};

type NetworkError = {
  message: string;
  type: string;
};

type MethodResponse = {
  "console-errors": BrowserError[];
  "network-errors": NetworkError[];
};

export type McpResponse<T extends MethodName> = {
  result: MethodResponse[T];
};

export class McpClient {
  async sendRequest<T extends MethodName>(method: T): Promise<McpResponse<T>> {
    return {
      result: [],
    };
  }
}
