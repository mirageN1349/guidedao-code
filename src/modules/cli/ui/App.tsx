import React, { useState } from "react";
import { Box, Text } from "ink";
import { AgentRuntime } from "@elizaos/core";
import Input from "./Input";
import Processing from "./Processing";
import Result from "./Result";
import { contextManager } from "../../../managers/contextManager";
import { chooseNextAction } from "../../llm/makeActionsList";
import { executeWithConfirmation } from "../../../managers/actionManager";

interface AppProps {
  agent: AgentRuntime;
}

enum AppState {
  INPUT,
  PROCESSING,
  RESULT,
}

const App: React.FC<AppProps> = ({ agent }) => {
  const [state, setState] = useState<AppState>(AppState.INPUT);
  const [userInput, setUserInput] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [contextSummary, setContextSummary] = useState<string>("");

  const handleSubmit = async (input: string) => {
    if (!input || input.trim() === "") {
      return;
    }

    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      process.exit(0);
    }

    if (input.toLowerCase() === "clear") {
      setState(AppState.INPUT);
      return;
    }

    setUserInput(input);
    setState(AppState.PROCESSING);

    try {
      contextManager.resetContext();
      let executionComplete = false;

      while (!executionComplete) {
        const currentContext = contextManager.getContext();
        const nextResponse = await chooseNextAction(
          agent,
          input,
          currentContext,
        );

        if (!nextResponse) {
          setResult("All actions completed successfully.");
          setContextSummary(contextManager.getContextSummary());
          setIsSuccess(true);
          executionComplete = true;
          continue;
        }

        if (Array.isArray(nextResponse)) {
          let allSuccessful = true;
          for (const action of nextResponse) {
            const actionToExecute = {
              ...action,
              systemPrompt: action.systemPrompt || "",
            };

            const res = await executeWithConfirmation(agent, actionToExecute);

            if (res.message) {
              contextManager.setLastActionResult(res.success, res.message);
            }

            contextManager.updateFromResponse(res.context);

            if (!res.success) {
              allSuccessful = false;
              break;
            }
          }

          setResult(
            allSuccessful
              ? "All actions completed successfully."
              : "Some actions failed.",
          );
          setContextSummary(contextManager.getContextSummary());
          setIsSuccess(allSuccessful);
          executionComplete = true;
        } else {
          const actionToExecute = {
            ...nextResponse,
            systemPrompt: nextResponse.systemPrompt || "",
          };

          const res = await executeWithConfirmation(agent, actionToExecute);

          if (res.message) {
            contextManager.setLastActionResult(res.success, res.message);
          }

          contextManager.updateFromResponse(res.context);

          if (!res.success) {
            setResult("Action failed.");
            setContextSummary(contextManager.getContextSummary());
            setIsSuccess(false);
            executionComplete = true;
          }
        }
      }

      setState(AppState.RESULT);
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      setIsSuccess(false);
      setState(AppState.RESULT);
    }
  };

  const handleResultDone = () => {
    setState(AppState.INPUT);
  };

  return (
    <Box flexDirection="column">
      {state === AppState.INPUT && <Input onSubmit={handleSubmit} />}

      {state === AppState.PROCESSING && <Processing input={userInput} />}

      {state === AppState.RESULT && (
        <Result
          message={result}
          contextSummary={contextSummary}
          isSuccess={isSuccess}
          onDone={handleResultDone}
        />
      )}
    </Box>
  );
};

export default App;
