import { Anthropic } from "@anthropic-ai/sdk";

export interface CharacterConfig {
  name: string;
  adjectives: string[];
  bio: string;
  system: string;
}

export class AnthropicClient {
  private client: Anthropic;
  private character: CharacterConfig;
  private systemPrompt: string;

  constructor(options: {
    apiKey: string;
    character: CharacterConfig;
    logging?: boolean;
  }) {
    this.client = new Anthropic({
      apiKey: options.apiKey,
    });
    this.character = options.character;

    this.systemPrompt = this.buildSystemPrompt();

    if (options.logging) {
      console.log(
        "AnthropicClient initialized with character:",
        this.character.name,
      );
    }
  }

  private buildSystemPrompt(): string {
    return `${this.character.system}\n\nYou are ${this.character.name}, ${this.character.adjectives.join(", ")}. ${this.character.bio}`;
  }

  async generateText(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    },
  ): Promise<string> {
    const model = options?.model || "claude-3-opus-20240229";
    const maxTokens = options?.maxTokens || 4096;
    const temperature = options?.temperature || 0.7;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: this.systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].text;
  }

  // Method to generate text with context from previous messages
  async generateTextWithContext(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    options?: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    },
  ): Promise<string> {
    const model = options?.model || "claude-3-opus-20240229";
    const maxTokens = options?.maxTokens || 4096;
    const temperature = options?.temperature || 0.7;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: this.systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return response.content[0].text;
  }
}
