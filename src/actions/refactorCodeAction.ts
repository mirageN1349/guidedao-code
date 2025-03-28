import { AgentRuntime, generateText, ModelClass } from '@elizaos/core';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'node:fs';
import { HandlerResponse, LLMAction } from './types';

export const refactorCodeAction = {
  name: 'REFACTOR_CODE',
  description: 'Refactor code',
  similes: ['refactor', 'improve', 'optimize'],
  handler: async (
    agent: AgentRuntime,
    action: LLMAction,
  ): Promise<HandlerResponse> => {
    try {
      const spinner = ora('Analyzing code for refactoring...').start();
      spinner.color = 'magenta';

      if (!fs.existsSync(action.filePath)) {
        spinner.stop();
        return {
          success: false,
          context: `File ${action.filePath} does not exist.`,
        };
      }

      const fileContent = await fs.promises.readFile(action.filePath, 'utf-8');

      const systemPrompt = `
        Original file content:
        ${fileContent}

        User request:
        ${action.prompt}

        Please analyze this code and provide a refactored version that improves:
        - Code organization and structure
        - Performance optimizations
        - Best practices and patterns
        - Code readability and maintainability
        
        Return ONLY the refactored code without any explanations or markup.
      `;

      const refactoredCode = await generateText({
        runtime: agent,
        context: systemPrompt,
        modelClass: ModelClass.SMALL,
      });

      await fs.promises.writeFile(action.filePath, refactoredCode);

      spinner.stop();

      console.log(chalk.green(`✅ Successfully refactored ${action.filePath}`));

      return {
        success: true,
        context: `File ${action.filePath} has been successfully refactored.`,
      };
    } catch (error) {
      return {
        success: false,
        context: `Failed to refactor file ${action.filePath}: ${(error as any).message}`,
      };
    }
  },
  validate: async () => {
    return true;
  },
  examples: [],
};