import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface InputProps {
  onSubmit: (input: string) => void;
}

const Input: React.FC<InputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    onSubmit(input);
    setInput("");
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
