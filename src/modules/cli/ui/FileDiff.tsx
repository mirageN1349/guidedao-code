import { Box, Text } from "ink";
import { parseDiffLines, FileDiffOperation } from "../lib/diffUtils";

interface FileDiffProps {
  operation: FileDiffOperation;
  boxWidth?: number;
}

function FileDiff({ operation, boxWidth = 100 }: FileDiffProps) {
  const { type, filePath, diff, errorMessage } = operation;
  
  // Border characters
  const topLeft = "╔";
  const topRight = "╗";
  const bottomLeft = "╚";
  const bottomRight = "╝";
  const horizontal = "═";
  const vertical = "║";
  const leftT = "╠";
  const rightT = "╣";

  // If there's an error or no diff, show error message
  if (type === 'error' || !diff) {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="cyan">{topLeft}{horizontal.repeat(boxWidth - 2)}{topRight}</Text>
        </Box>
        
        <Box>
          <Text color="cyan">{vertical}</Text>
          <Text color="red"> {errorMessage || 'Unknown error'} </Text>
          <Text color="cyan">{vertical}</Text>
        </Box>
        
        <Box>
          <Text color="cyan">{bottomLeft}{horizontal.repeat(boxWidth - 2)}{bottomRight}</Text>
        </Box>
      </Box>
    );
  }

  // Prepare title based on operation type
  const title = "📄 FILE CHANGES";
  const titlePadding = Math.floor((boxWidth - 2 - title.length) / 2);
  
  // Prepare subtitle based on operation type
  const getSubtitle = () => {
    if (type === 'create') {
      return `📝 Creating: ${filePath}`;
    } else {
      return `✏️ Editing: ${filePath}`;
    }
  };
  
  const subtitle = getSubtitle();
  const subtitlePadding = boxWidth - 3 - subtitle.length;
  
  // Parse diff lines to display with colors
  const diffLines = parseDiffLines(diff);

  return (
    <Box flexDirection="column">
      {/* Top border */}
      <Box>
        <Text color="cyan">{topLeft}{horizontal.repeat(boxWidth - 2)}{topRight}</Text>
      </Box>
      
      {/* Title */}
      <Box>
        <Text color="cyan">{vertical}</Text>
        <Text>
          {" ".repeat(titlePadding)}
          <Text bold color="cyan">{title}</Text>
          {" ".repeat(boxWidth - 2 - title.length - titlePadding)}
        </Text>
        <Text color="cyan">{vertical}</Text>
      </Box>
      
      {/* Divider */}
      <Box>
        <Text color="cyan">{leftT}{horizontal.repeat(boxWidth - 2)}{rightT}</Text>
      </Box>
      
      {/* Subtitle */}
      <Box>
        <Text color="cyan">{vertical}</Text>
        <Text>
          <Text bold color="cyan"> {subtitle} </Text>
          {" ".repeat(Math.max(1, subtitlePadding))}
        </Text>
        <Text color="cyan">{vertical}</Text>
      </Box>
      
      {/* Divider */}
      <Box>
        <Text color="cyan">{leftT}{horizontal.repeat(boxWidth - 2)}{rightT}</Text>
      </Box>
      
      {/* Diff content */}
      {diffLines.map((line, index) => {
        // Calculate padding to ensure the line fits in the box
        const plainText = line.text.replace(/\u001b\[\d+m/g, ""); // Remove ANSI color codes
        const padLength = Math.max(1, boxWidth - 3 - plainText.length);
        
        return (
          <Box key={index}>
            <Text color="cyan">{vertical}</Text>
            <Text>
              {" "}
              {line.type === 'header' ? (
                <Text color="cyan">{line.text}</Text>
              ) : line.type === 'addition' ? (
                <Text color="green">{line.text}</Text>
              ) : line.type === 'deletion' ? (
                <Text color="red">{line.text}</Text>
              ) : (
                line.text
              )}
              {" ".repeat(padLength)}
            </Text>
            <Text color="cyan">{vertical}</Text>
          </Box>
        );
      })}
      
      {/* Bottom border */}
      <Box>
        <Text color="cyan">{bottomLeft}{horizontal.repeat(boxWidth - 2)}{bottomRight}</Text>
      </Box>
    </Box>
  );
}

export default FileDiff;