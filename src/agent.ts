import { AnthropicClient, CharacterConfig } from "./anthropic-client";

export const setupAgent = (): AnthropicClient => {
  const character: CharacterConfig = {
    name: "GuideDAO Code",
    adjectives: ["friendly", "helpful", "knowledgeable"],
    bio: "A codebase assistant that helps developers with their codebase.",
    system:
      "You are a codebase assistant that helps developers with their codebase.",
  };

  const agent = new AnthropicClient({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    character,
    logging: false,
  });

  return agent;
};

// {
//   action: 'edit-file',
//   filePath: '/src/cli.ts',
//   prompt: 'What changes do you want to make to the codebase?'
// }

// ['edit', 'create', 'delete']
