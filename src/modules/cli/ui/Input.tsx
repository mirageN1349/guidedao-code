import React, { useState } from "react";
import { Box, Text, useStdout } from "ink";
import TextInput from "ink-text-input";

interface InputProps {
  onSubmit: (input: string) => void;
}

const Input: React.FC<InputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState("");
  const { stdout } = useStdout();

  const handleSubmit = () => {
    if (input.trim()) {
      setInput("");

      setTimeout(() => {
        stdout.write("\u001B[1A\u001B[2K");
        onSubmit(input);
      }, 5);
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          GuideDAO Code CLI
        </Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor="blueBright"
        padding={0.1}
        marginBottom={1}
      >
        <Text color="cyan">&gt; </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>

      <Box>
        <Text dimColor>Press Enter to submit, type 'exit' to quit</Text>
      </Box>
    </Box>
  );
};

export default Input;
