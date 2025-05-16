import { Box, Text } from "ink";

interface LogsProps {
  logs: string[];
}

function Logs({ logs }: LogsProps) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="yellow">
        Logs:
      </Text>
      {logs.map((log, index) => (
        <Text key={index} color="gray">
          {log}
        </Text>
      ))}
    </Box>
  );
}

export default Logs;
