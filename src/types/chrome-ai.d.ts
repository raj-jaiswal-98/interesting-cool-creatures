export interface AILanguageModelSession {
  prompt(input: string): Promise<string>;
  destroy?(): void;
}

interface AILanguageModelFactory {
  availability?(): Promise<string>;
  capabilities?(): Promise<{ available: string }>;
  create(options?: { systemPrompt?: string }): Promise<AILanguageModelSession>;
}

declare global {
  interface Window {
    ai?: {
      languageModel?: AILanguageModelFactory;
    };
  }
}
