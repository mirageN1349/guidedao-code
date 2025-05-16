import * as diffLib from 'diff';
import fs from 'node:fs';

/**
 * Creates a unified diff between two content strings
 */
export function createDiff(
  filePath: string,
  oldContent: string,
  newContent: string,
  oldHeader: string = 'Original',
  newHeader: string = 'Modified'
): string {
  return diffLib.createPatch(
    filePath,
    oldContent,
    newContent,
    oldHeader,
    newHeader
  );
}

/**
 * Generate a diff for a file creation
 */
export function createFileDiff(filePath: string, content: string): string {
  return createDiff(
    filePath,
    '',
    content,
    'Empty file',
    'New file content'
  );
}

/**
 * Generate a diff for a file edit
 */
export function editFileDiff(filePath: string, newContent: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const oldContent = fs.readFileSync(filePath, 'utf-8');
  return createDiff(
    filePath,
    oldContent,
    newContent,
    'Original content',
    'Modified content'
  );
}

/**
 * Parse a diff into lines with type information
 */
export function parseDiffLines(diff: string): Array<{text: string, type: 'header' | 'addition' | 'deletion' | 'context'}> {
  const lines = diff.split('\n');
  
  return lines.map(line => {
    if (line.startsWith('+++ ') || line.startsWith('--- ') || line.startsWith('@@')) {
      return { text: line, type: 'header' };
    } else if (line.startsWith('+')) {
      return { text: line, type: 'addition' };
    } else if (line.startsWith('-')) {
      return { text: line, type: 'deletion' };
    } else {
      return { text: line, type: 'context' };
    }
  });
}

/**
 * Type for file operation with diff
 */
export interface FileDiffOperation {
  type: 'create' | 'edit' | 'error';
  filePath: string;
  diff: string | null;
  errorMessage?: string;
}

/**
 * Generate diff for a file operation
 */
export function generateFileDiff(
  type: 'create' | 'edit',
  filePath: string,
  content: string
): FileDiffOperation {
  try {
    if (type === 'create') {
      return {
        type: 'create',
        filePath,
        diff: createFileDiff(filePath, content)
      };
    } else {
      const diff = editFileDiff(filePath, content);
      
      if (diff === null) {
        return {
          type: 'error',
          filePath,
          diff: null,
          errorMessage: `File ${filePath} does not exist for editing`
        };
      }
      
      return {
        type: 'edit',
        filePath,
        diff
      };
    }
  } catch (error) {
    return {
      type: 'error',
      filePath,
      diff: null,
      errorMessage: `Error generating diff: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}