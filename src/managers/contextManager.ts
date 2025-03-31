import { ActionContext, FileOperation, OperationType } from "../actions/types";

const getOperationIcon = (type: OperationType): string => {
  switch (type) {
    case "read": return "📖";
    case "edit": return "✏️";
    case "create": return "🆕";
    case "delete": return "🗑️";
    case "move": return "🔄";
    case "search": return "🔍";
    default: return "";
  }
};

export class ContextManager {
  private context: ActionContext;

  constructor() {
    this.context = this.createInitialContext();
  }

  private createInitialContext(): ActionContext {
    return {
      fileOperations: [],
      notes: [],
    };
  }

  public getContext(): ActionContext {
    return { ...this.context };
  }

  public resetContext(): void {
    this.context = this.createInitialContext();
  }

  public addNote(note: string): void {
    this.context.notes.push(note);
  }

  public addFileOperation(
    type: FileOperation["type"],
    filePath: string,
    description: string,
  ): void {
    const newOperation: FileOperation = {
      type,
      filePath,
      description,
      timestamp: Date.now(),
    };

    this.context.fileOperations.push(newOperation);
    this.addNote(
      `${type.toUpperCase()} operation on ${filePath}: ${description}`,
    );
  }

  public setLastActionResult(success: boolean, message: string): void {
    this.context.lastActionResult = {
      success,
      message,
    };
    this.addNote(
      `Last action result: ${success ? "SUCCESS" : "FAILURE"} - ${message}`,
    );
  }

  public getContextSummary(): string {
    let summary = "Context Summary:\n";

    const recentOperations = this.context.fileOperations
      .slice(-5) // Last 5 operations
      .map((op) => `- ${op.type.toUpperCase()} ${op.filePath}`);

    if (recentOperations.length > 0) {
      summary += "\nRecent operations:\n" + recentOperations.join("\n");
    }

    // Add last action result if exists
    if (this.context.lastActionResult) {
      summary += `\n\nLast result: ${this.context.lastActionResult.success ? "✅" : "❌"} ${this.context.lastActionResult.message}`;
    }

    return summary;
  }

  public updateFromResponse(actionContext: ActionContext): void {
    this.context = {
      ...this.context,
      ...actionContext,
      fileOperations: [
        ...this.context.fileOperations,
        ...(actionContext.fileOperations || []),
      ],
      notes: [...this.context.notes, ...(actionContext.notes || [])],
    };
  }

  public formatContextForLLM(): string {
    let formattedContext = "";

    if (this.context.fileOperations.length > 0) {
      formattedContext += `## FILE OPERATIONS HISTORY\n\n`;

      const sortedOperations = [...this.context.fileOperations]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 15);

      sortedOperations.forEach((op) => {
        formattedContext += `- ${op.type.toUpperCase()} ${op.filePath}: ${op.description}\n`;
      });

      formattedContext += "\n";
    }

    if (this.context.lastActionResult) {
      formattedContext += `## LAST ACTION RESULT\n`;
      formattedContext += `Status: ${this.context.lastActionResult.success ? "SUCCESS" : "FAILURE"}\n`;
      formattedContext += `Message: ${this.context.lastActionResult.message}\n\n`;
    }

    if (this.context.notes && this.context.notes.length > 0) {
      formattedContext += `## NOTES\n`;
      this.context.notes.slice(-8).forEach((note) => {
        formattedContext += `- ${note}\n`;
      });
    }

    formattedContext += `\n## SUMMARY\n`;

    formattedContext += `- Total operations: ${this.context.fileOperations.length}\n`;

    const operationCounts = this.context.fileOperations.reduce(
      (acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    Object.entries(operationCounts).forEach(([type, count]) => {
      formattedContext += `- ${type.toUpperCase()} operations: ${count}\n`;
    });

    if (this.context.fileOperations.length > 0) {
      const lastOp =
        this.context.fileOperations[this.context.fileOperations.length - 1];
      formattedContext += `- Most recent activity: ${lastOp.type.toUpperCase()} on ${lastOp.filePath}\n`;
    }

    if (this.context.lastActionResult) {
      formattedContext += `- Last result: ${this.context.lastActionResult.success ? "Success" : "Failure"} - ${this.context.lastActionResult.message.substring(
        0,
        100,
      )}${this.context.lastActionResult.message.length > 100 ? "..." : ""}\n`;
    }

    return formattedContext;
  }
}

export const contextManager = new ContextManager();
