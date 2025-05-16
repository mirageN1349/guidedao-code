import { useState } from "react";
import { Box } from "ink";
import { AnthropicClient } from "../../../anthropic-client";
import Input from "./Input";
import Processing from "./Processing";
import Result from "./Result";
import Logs from "./Logs";
import FileDiff from "./FileDiff";
import { runUserCommand } from "../lib/actions";
import { FileDiffOperation } from "../lib/diffUtils";

interface AppProps {
  agent: AnthropicClient;
}

enum AppState {
  INITIAL,
  PROCESSING,
  CONFIRMING,
  RESULT,
}

const App: React.FC<AppProps> = ({ agent }) => {
  const [state, setState] = useState<AppState>(AppState.INITIAL);
  const [userInput, setUserInput] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [contextSummary, setContextSummary] = useState<string>("");
  const [fileDiff, setFileDiff] = useState<FileDiffOperation | undefined>(
    undefined,
  );

  const [logs, setLogs] = useState<string[]>([]);
  const addStatusLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const updateFileDiff = (diff: FileDiffOperation | undefined) => {
    setFileDiff(diff);
    if (diff) {
      setState(AppState.CONFIRMING);
    } else if (state === AppState.CONFIRMING) {
      // Force clear screen buffer before switching back to processing
      process.stdout.write('\x1b[2J\x1b[0f');
      setState(AppState.PROCESSING);
    }
  };

  const handleSubmit = async (input: string) => {
    if (!input || input.trim() === "") {
      return;
    }

    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      process.exit(0);
    }

    if (input.toLowerCase() === "clear") {
      setState(AppState.INITIAL);
      setFileDiff(undefined);
      return;
    }

    setUserInput(input);
    setFileDiff(undefined);
    setState(AppState.PROCESSING);

    const commandResult = await runUserCommand(
      agent,
      input,
      addStatusLog,
      updateFileDiff,
    );

    // Before setting result, ensure we're not in CONFIRMING state
    if (state === AppState.CONFIRMING) {
      setState(AppState.PROCESSING);
      // Small delay to ensure UI updates properly
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setResult(commandResult.message);
    setContextSummary(commandResult.contextSummary);
    setIsSuccess(commandResult.success);
    if (commandResult.fileDiff) {
      setFileDiff(commandResult.fileDiff);
    }
    setState(AppState.RESULT);
  };

  const handleResultDone = () => {
    setState(AppState.INITIAL);
  };

  return (
    <Box flexDirection="column">
      {state === AppState.PROCESSING && (
        <>
          <Processing input={userInput} />
        </>
      )}

      {fileDiff && state === AppState.CONFIRMING && (
        <FileDiff operation={fileDiff} boxWidth={100} />
      )}

      <Input onSubmit={handleSubmit} />

      {/* <Logs logs={logs} /> */}

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
