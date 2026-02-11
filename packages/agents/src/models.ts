/**
 * Available AI models for content creation.
 *
 * This file has NO @mastra/* imports so it can be safely consumed
 * by the frontend without pulling in heavy server-side type dependencies.
 */

export const AVAILABLE_MODELS = {
   "openrouter/x-ai/grok-4.1-fast": {
      label: "Grok 4.1 Fast",
      provider: "xAI",
      description: "Fast, high-quality writing model",
      default: true,
   },
   "openrouter/minimax/minimax-m2.1": {
      label: "MiniMax M2.1",
      provider: "MiniMax",
      description: "Balanced model for content generation",
   },
   "openrouter/mistralai/mistral-small-creative": {
      label: "Mistral Small Creative",
      provider: "Mistral",
      description: "Creative writing with smaller footprint",
   },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

export const DEFAULT_MODEL_ID: ModelId = "openrouter/x-ai/grok-4.1-fast";
