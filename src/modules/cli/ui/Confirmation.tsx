import React, { useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import FileDiff from "./FileDiff";
import { FileDiffOperation } from "../lib/diffUtils";

export interface ConfirmationOption {
  label: string;
  value: string;
}

interface ConfirmationProps {
  message: string;
  options: ConfirmationOption[];
  onConfirm: (value: string, modifiedPrompt?: string) => void;
  actionPrompt?: string;
  showModify?: boolean;
  fileDiff?: FileDiffOperation;
}

const Confirmation: React.FC<ConfirmationProps> = ({
  message,
  options,
  onConfirm,
  actionPrompt,
  showModify = false,
  fileDiff,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [modifyMode, setModifyMode] = useState(false);
  const [modifiedPrompt, setModifiedPrompt] = useState(actionPrompt || "");

  const handleSelect = (item: { value: string }) => {
    if (item.value === "modify" && showModify) {
      setModifyMode(true);
      setSelected("modify");
    } else {
      setSelected(item.value);
      
      // Add a small delay before confirming to allow UI to update
      setTimeout(() => {
        onConfirm(item.value);
      }, 10);
    }
  };

  const handleModifySubmit = () => {
    onConfirm(selected || "", modifiedPrompt);
  };

  return (
    <Box flexDirection="column">
      {/* Show file diff if provided */}
      {fileDiff && <FileDiff operation={fileDiff} boxWidth={100} />}

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="yellow"
        padding={1}
        marginY={1}
      >
        <Text bold color="yellow">
          {message}
        </Text>

        {!modifyMode ? (
          <SelectInput items={options} onSelect={handleSelect} />
        ) : (
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray">Original prompt: {actionPrompt}</Text>
            <Box marginTop={1}>
              <Text color="cyan">Modified prompt: </Text>
              <TextInput
                value={modifiedPrompt}
                onChange={setModifiedPrompt}
                onSubmit={handleModifySubmit}
              />
            </Box>
            <Text dimColor>Press Enter to confirm</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Confirmation;
