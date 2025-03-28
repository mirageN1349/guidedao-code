import { Character } from "@elizaos/core";
import { ModelProviderName } from "@elizaos/core";
import { AgentRuntime } from "@elizaos/core";
import Database from "better-sqlite3";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";

export const setupAgent = (): AgentRuntime => {
  const character: Character = {
    name: "GuideDAO Code",
    adjectives: ["friendly", "helpful", "knowledgeable"],
    lore: [],
    postExamples: [],
    messageExamples: [],
    plugins: [],
    modelProvider: ModelProviderName.ANTHROPIC,

    bio: "A codebase assistant that helps developers with their codebase.",
    system:
      "You are a codebase assistant that helps developers with their codebase.",
    style: {
      all: [],
      chat: [],
      post: [],
    },
    topics: [],
  };

  const db = new Database("guidedao-code.db");
  const databaseAdapter = new SqliteDatabaseAdapter(db);
  databaseAdapter.init();

  const agent = new AgentRuntime({
    token: process.env.ANTHROPIC_API_KEY || "",
    modelProvider: ModelProviderName.ANTHROPIC,
    character,
    databaseAdapter,
  });

  agent.initialize();

  return agent;
};


// {
//   action: 'edit-file',
//   filePath: '/src/cli.ts',
//   prompt: 'What changes do you want to make to the codebase?'
// }

// ['edit', 'create', 'delete']
