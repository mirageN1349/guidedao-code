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
  "network-errors": NetworkError[];
  "console-errors": BrowserError[];
};

export type McpResponse<T extends MethodName> = {
  result: MethodResponse[T];
};

const isNetworkResponse = (
  data: BrowserError[] | NetworkError[],
): data is MethodResponse["network-errors"] => {
  return "type" in data[0] ? true : false;
};

export class BrowserMcpClient {
  private host = "127.0.0.1";
  private port = 3025;
  private connected = false;

  async sendRequest<T extends keyof MethodResponse>(
    method: T,
  ): Promise<MethodResponse[T]> {
    const res = await fetch(`http://${this.host}:${this.port}/${method}`);
    const data = await res.json();

    return data;
  }
}

export const mcpBrowserClient = new BrowserMcpClient();
