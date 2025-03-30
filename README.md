# GuideDAO Code

<div align="center">
  <img src="https://i.postimg.cc/vB8hD5qn/guidedao-code.png" alt="GuideDAO Code Architecture" />

  <p>
    <strong>Intelligent Code Assistant for Your Codebase</strong>
  </p>

  <p>
    <a href="#installation"><strong>Installation</strong></a> •
    <a href="#usage"><strong>Usage</strong></a> •
    <a href="#commands"><strong>Commands</strong></a> •
    <a href="#architecture"><strong>Architecture</strong></a> •
    <a href="#development"><strong>Development</strong></a>
  </p>
</div>

## 📋 Overview

GuideDAO Code is an intelligent CLI assistant for working with your codebase, designed to simplify development and maintenance processes. Using powerful LLM models, GuideDAO Code helps you analyze, modify, and understand code by responding to your natural language requests.

## ✨ Features

- 🔍 **Code Analysis** - explanation of complex parts of your codebase
- ✏️ **File Modification** - editing, creating, and deleting files based on requests
- 🔄 **File Management** - moving and renaming files
- 🐛 **Error Fixing** - analyzing and fixing browser errors
- 📚 **Documentation** - generating explanations and documentation

## 🚀 Installation

### Global Installation

```bash
npm install -g guidedao-code
```

### Local Installation

```bash
npm install guidedao-code
```

## 🖥️ Usage

### Running via CLI

```bash
guidedao-code
```

This will launch an interactive CLI interface in your current project directory.

### Example Requests

After launching the CLI, you can enter natural language requests:

```
guidedao-code> Explain the project structure
```

```
guidedao-code> Create a new utils/helpers.ts file with date utility functions
```

```
guidedao-code> Fix browser errors
```

## 🛠️ Commands

GuideDAO Code supports the following commands:

| Command              | Description        | Example Usage                                            |
| -------------------- | ------------------ | -------------------------------------------------------- |
| `READ_FILE`          | Read file content  | `Show me the content of src/index.ts`                    |
| `EDIT_FILE`          | Edit a file        | `Add logging to the login function in auth.js`           |
| `CREATE_FILE`        | Create a new file  | `Create a Button component in src/components/Button.tsx` |
| `DELETE_FILE`        | Delete a file      | `Delete the unused old-utils.js file`                    |
| `MOVE_FILE`          | Move/rename a file | `Move auth.js to the services folder`                    |
| `EXPLAIN_FILE`       | Explain a file     | `Explain what webpack.config.js does`                    |
| `FIX_BROWSER_ERRORS` | Fix browser errors | `Fix errors in the browser console`                      |

## 🏗️ Architecture

GuideDAO Code uses the following architecture:

![System Architecture](https://i.postimg.cc/vB8hD5qn/guidedao-code.png)

### Key Components:

- **CLI Interface** - user interaction
- **LLM Model** - natural language processing and code generation
- **Codebase Manager** - scanning and managing project files
- **Action Handlers** - performing operations on files

## 🧩 Integrations

GuideDAO Code integrates with:

- 🌐 **MCP Browser Client** - for analyzing browser errors
- 🤖 **Anthropic Claude** - for natural language processing
- 🗄️ **SQLite** - for local data storage

## 💻 Development

### Requirements

- Node.js 20+
- pnpm 9+

### Installing Dependencies

```bash
pnpm install
```

### Building the Project

```bash
pnpm run build
```

### Running in Development Mode

```bash
pnpm run dev
```

## 🔑 Configuration

To work with different LLM models, create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your-api-key
```

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a branch for your changes
3. Make changes and create a PR

## 📄 License

ISC
