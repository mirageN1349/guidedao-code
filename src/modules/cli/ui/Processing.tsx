import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";

interface ProcessingProps {
  input: string;
}

function Processing({ input }: ProcessingProps) {
  // Add a timestamp state to force re-render
  const [timestamp, setTimestamp] = useState(Date.now());

  // Force periodic re-renders to ensure component is visible
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Box marginBottom={1} key={`processing-${timestamp}`}>
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
      <Text color="cyan"> Processing {input}...</Text>
    </Box>
  );
}

export default Processing;
