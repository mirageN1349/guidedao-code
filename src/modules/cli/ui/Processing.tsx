import React from "react";
import { Box, Newline, Text } from "ink";
import Spinner from "ink-spinner";

interface ProcessingProps {
  input: string;
}

const Processing: React.FC<ProcessingProps> = ({ input }) => {
  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold color="cyan">
          Processing:{" "}
        </Text>
        <Text>{input}</Text>
      </Box>

      {/* <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text color="cyan"> Thinking...</Text>
      </Box> */}
    </Box>
  );
};

export default Processing;
