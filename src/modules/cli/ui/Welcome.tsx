import React from 'react';
import { Box, Text } from 'ink';
import figlet from 'figlet';

interface WelcomeProps {
  isScanning: boolean;
  isReady: boolean;
}

const Welcome: React.FC<WelcomeProps> = ({ isScanning, isReady }) => {
  const banner = figlet.textSync('GUIDEDAO CODE', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 100,
  });

  return (
    <Box flexDirection="column" marginY={1}>
      <Text color="cyan">{banner}</Text>
      
      <Box marginY={1}>
        <Text bold color="cyan">✨ Your AI-powered coding companion ✨</Text>
      </Box>

      {isScanning && (
        <Box>
          <Text color="blue">🔍 Scanning codebase...</Text>
        </Box>
      )}

      {isReady && (
        <Box marginY={1}>
          <Text color="green">✅ Ready to assist with your code!</Text>
        </Box>
      )}
    </Box>
  );
};

export default Welcome;