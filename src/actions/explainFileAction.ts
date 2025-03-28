import { AgentRuntime, generateText, ModelClass } from "@elizaos/core";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import { HandlerResponse, LLMAction } from "./types";

export const explainFileAction = {
  name: "EXPLAIN_FILE",
  description: "Explain file",
  similes: ["explain", "describe", "understand"],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora("Analyzing file...").start();
      spinner.color = "cyan";

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();
        return {
          success: false,
          context: `File ${action.filePath} does not exist.`,
        };
      }

      const fileContent = await fs.promises.readFile(action.filePath, "utf-8");

      const systemPrompt = `
        File content:
        \`\`\`
        ${fileContent}
        \`\`\`

        User request:
        ${action.prompt}

        Please provide a clear explanation of this file.
        Focus on:
        - What the code does
        - Key functions and their purpose
        - How this file fits into the overall architecture
        - Any important patterns or techniques used
      `;

      const explanation = await generateText({
        runtime: agent,
        context: systemPrompt,
        modelClass: ModelClass.SMALL,
      });

      spinner.stop();

      console.log(
        chalk.green(`✅ Explanation generated for ${action.filePath}`),
      );
      console.log(chalk.white(explanation));

      return {
        success: true,
        context: `File ${action.filePath} has been successfully explained.  ${explanation}`,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to explain file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};
