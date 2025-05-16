import React, { useEffect } from 'react';
import { Box, Text } from 'ink';

interface ResultProps {
  message: string;
  contextSummary: string;
  isSuccess: boolean;
  onDone: () => void;
}

const Result: React.FC<ResultProps> = ({ 
  message, 
  contextSummary, 
  isSuccess, 
  onDone 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Box flexDirection="column">
      <Box 
        borderStyle="round" 
        borderColor={isSuccess ? 'green' : 'yellow'} 
        padding={1} 
        marginBottom={1}
      >
        <Text color={isSuccess ? 'green' : 'yellow'}>
          {isSuccess ? '✅ ' : '⚠️ '}
          {message}
          {contextSummary && '\n\n'}
          {contextSummary && <Text dimColor>{contextSummary}</Text>}
        </Text>
      </Box>
      
      <Box>
        <Text dimColor>Returning to input in 3 seconds...</Text>
      </Box>
    </Box>
  );
};

export default Result;