import { glob } from "glob";
import fs from "fs";
import path from "path";

type File = {
  path: string;
  // content: string;
  extension: string;
};

export type Codebase = {
  files: File[];
};

export class CodebaseManager {
  codebase: Codebase;

  constructor() {
    this.codebase = {
      files: [],
    };
  }

  scanCodebase = async (projectPath: string): Promise<Codebase> => {
    const files: File[] = [];

    const filePaths = await glob("**/*.*", {
      cwd: projectPath,
      dot: false,
      ignore: ["node_modules/**/*", "dist/**/*", "*.db"],
    });

    for (const filePath of filePaths) {
      const fullPath = path.join(projectPath, filePath);
      const content = await fs.promises.readFile(fullPath, "utf8");

      const stats = fs.statSync(fullPath);

      if (stats.size > 200_000) {
        continue;
      }

      files.push({
        path: filePath,
        // content
        extension: path.extname(filePath),
      });
    }

    this.codebase.files = files;

    return {
      files,
    };
  };
}

export const codebaseManager = new CodebaseManager();
export const codebase = codebaseManager.codebase;
