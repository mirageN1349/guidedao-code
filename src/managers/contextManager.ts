import { countTokens } from "@anthropic-ai/tokenizer";
import { ActionContext, FileOperation } from "../actions/types";

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
    this.context.notes.push({
      content: note,
      tokensCount: countTokens(note),
    });
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
      tokensCount: countTokens(`${type}: ${filePath}: ${description}`),
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
        formattedContext += `- ${note.content}\n`;
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

  public getOptimzedContext() {
    const maxTokensCount = 80_000;
    let optimizedContext = "";

    // Calculate total tokens in file operations and notes
    const fileOperationsTokens = this.context.fileOperations.reduce(
      (total, op) => total + (op.tokensCount || 0),
      0,
    );

    const notesTokens = this.context.notes.reduce(
      (total, note) => total + (note.tokensCount || 0),
      0,
    );

    const totalTokens = fileOperationsTokens + notesTokens;

    // If we exceed the max token count, trim older items
    if (totalTokens > maxTokensCount) {
      const excessTokens = totalTokens - maxTokensCount;

      // Create copies to work with
      let fileOps = [...this.context.fileOperations];
      let notes = [...this.context.notes];

      // Remove oldest items first until we're under the limit
      let tokensRemoved = 0;

      // Remove oldest file operations first
      while (tokensRemoved < excessTokens && fileOps.length > 0) {
        const oldestOp = fileOps.shift();
        if (oldestOp && oldestOp.tokensCount) {
          tokensRemoved += oldestOp.tokensCount;
        }
      }

      // If we still need to remove more tokens, trim notes
      while (tokensRemoved < excessTokens && notes.length > 0) {
        const oldestNote = notes.shift();
        if (oldestNote && oldestNote.tokensCount) {
          tokensRemoved += oldestNote.tokensCount;
        }
      }

      optimizedContext = `Context was trimmed to fit within ${maxTokensCount} tokens. Removed ${tokensRemoved} tokens from oldest operations and notes.`;
    }

    return `
   OptimizedContext:
  ${optimizedContext}
  ------
  ${this.formatContextForLLM()}`;
  }
}

export const contextManager = new ContextManager();

// context -  80 000
// RAG -
//
// text -> embeddings
// hellow world -> [12,4 4354,545]
//
// user request ->  llm context
// user request -> rag (text)  llm context

//  напиши   ->  rag() -> files ->  context
