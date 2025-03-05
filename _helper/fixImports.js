import { promises } from "fs";
import { join } from "path";
import chalk from "chalk";

const outDir = "./dist";

async function fixImports(filePath) {
  try {
    let content = await promises.readFile(filePath, "utf8");
    content = content.replace(/from\s+["'](\..+?)["']/g, 'from "$1.js"');
    await promises.writeFile(filePath, content, "utf8");

    console.log(chalk.green(`✅ Fixed imports in: ${filePath}`));
  } catch (error) {
    console.log(chalk.red(`❌ Error processing file ${filePath}:`, error));
  }
}

async function processDirectory(dir) {
  try {
    const files = await promises.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = join(dir, file.name);

      if (file.isDirectory()) {
        await processDirectory(fullPath);
      } else if (file.name.endsWith(".js")) {
        await fixImports(fullPath);
      }
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error processing directory ${dir}:`, error));
  }
}

(async () => {
  try {
    console.log(chalk.yellow("🚀 Starting import fix..."));
    await processDirectory(outDir);
    console.log(chalk.yellow("🎉 Import fix completed"));
  } catch (error) {
    console.log(chalk.red("❌ Critical error::", error));
    process.exit(1);
  }
})();
