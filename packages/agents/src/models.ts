/**
 * Available AI models for content creation.
 *
 * This file has NO @mastra/* imports so it can be safely consumed
 * by the frontend without pulling in heavy server-side type dependencies.
 */

export type ModelPreset = {
   label: string;
   provider: string;
   description: string;
   temperature: number;
   topP: number;
   maxTokens: number;
   frequencyPenalty?: number;
   presencePenalty?: number;
   default?: true;
};

// ─── Content / Agent Models ───────────────────────────────────────────────────
// Used by: unifiedContentAgent, aiCommandStream, executeUnifiedAgent
// Purpose: Orchestrate full content workflows (plan→research→write→SEO→review)

export const CONTENT_MODELS = {
   "openrouter/google/gemini-3-flash-preview": {
      label: "Gemini 3 Flash",
      provider: "Google",
      description:
         "Contexto de 1M tokens — perfeito para agentes que leem documentos longos, clusters de conteúdo e análise de concorrentes em larga escala",
      temperature: 0.8,
      topP: 0.95,
      maxTokens: 8192,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
   },

   "openrouter/openai/gpt-oss-120b": {
      label: "GPT-OSS-120B",
      provider: "OpenAI",
      description:
         "MoE de alta raciocínio (117B params, 5.1B ativos) — melhor para conteúdo técnico complexo, SEO de nicho e artigos com profundidade editorial",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 8192,
      frequencyPenalty: 0.3,
      presencePenalty: 0.2,
   },
   "openrouter/openai/gpt-oss-20b": {
      label: "GPT-OSS-20B",
      provider: "OpenAI",
      description:
         "MoE leve (21B params, 3.6B ativos) — boa relação custo-benefício para geração de conteúdo em volume: descrições, meta-textos e artigos padrão",
      temperature: 0.65,
      topP: 0.9,
      maxTokens: 6144,
      frequencyPenalty: 0.3,
      presencePenalty: 0.1,
   },
   "openrouter/moonshotai/kimi-k2.5": {
      label: "Kimi K2.5",
      provider: "Moonshot AI",
      description:
         "Multimodal nativo com visão — adequado para conteúdo que analisa imagens, infográficos ou screenshots de SERPs como parte do workflow",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 8192,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
      default: true,
   },
   "openrouter/minimax/minimax-m2.5": {
      label: "MiniMax M2.5",
      provider: "MiniMax",
      description:
         "Treinado em ambientes de trabalho reais — bom para conteúdo B2B, cases de uso corporativos e textos orientados à produtividade",
      temperature: 0.65,
      topP: 0.9,
      maxTokens: 6144,
      frequencyPenalty: 0.3,
      presencePenalty: 0.1,
   },
   "openrouter/z-ai/glm-5": {
      label: "Z.ai GLM 5",
      provider: "Z.ai",
      description:
         "Especializado em sistemas complexos e workflows de agente de longa duração — ideal para clusters de conteúdo e pillar pages com muitas seções interligadas",
      temperature: 0.6,
      topP: 0.9,
      maxTokens: 8192,
      frequencyPenalty: 0.3,
      presencePenalty: 0.2,
   },
   "openrouter/bytedance-seed/seed-2.0-mini": {
      label: "Seed 2.0 Mini",
      provider: "ByteDance",
      description:
         "Ultra-rápido com deep thinking e suporte multimodal — boa opção para geração rápida de rascunhos e iteração ágil em conteúdo",
      temperature: 0.75,
      topP: 0.95,
      maxTokens: 6144,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
   },
   "openrouter/liquid/lfm2-8b-a1b": {
      label: "LFM2-8B-A1B",
      provider: "Liquid AI",
      description:
         "MoE ultra-leve (8.3B, 1.5B ativos) — opção econômica para equipes em plano FREE que precisam de geração básica de conteúdo",
      temperature: 0.6,
      topP: 0.9,
      maxTokens: 4096,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
   },
} as const satisfies Record<string, ModelPreset>;

// ─── Autocomplete / FIM Models ────────────────────────────────────────────────
// Used by: fimAgent, copilotStream
// Purpose: Real-time text completions while user types — latency critical

export const AUTOCOMPLETE_MODELS = {
   "openrouter/openai/gpt-oss-20b": {
      label: "GPT-OSS-20B",
      provider: "OpenAI",
      description:
         "Baixíssima latência com qualidade consistente — garante que as sugestões de autocomplete fluam naturalmente com o estilo de escrita do usuário",
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 150,
      default: true,
   },
   "openrouter/liquid/lfm2-8b-a1b": {
      label: "LFM2-8B-A1B",
      provider: "Liquid AI",
      description:
         "Modelo de edge ultra-eficiente — completions quase instantâneas, ideal para equipes em plano FREE com alto volume de escrita",
      temperature: 0.15,
      topP: 0.85,
      maxTokens: 100,
   },
   "openrouter/liquid/lfm-2.2-6b": {
      label: "LFM2-2.6B",
      provider: "Liquid AI",
      description:
         "O menor e mais rápido da família Liquid — custo praticamente zero por completion, bom para volume massivo de sugestões inline",
      temperature: 0.1,
      topP: 0.85,
      maxTokens: 80,
   },
   "openrouter/google/gemini-2.5-flash-lite": {
      label: "Gemini 2.5 Flash Lite",
      provider: "Google",
      description:
         '1M de contexto com baixo custo — consegue "ver" o artigo inteiro ao sugerir a próxima frase, mantendo consistência com o que já foi escrito',
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 150,
   },
   "openrouter/stepfun/step-3.5-flash": {
      label: "Step 3.5 Flash",
      provider: "StepFun",
      description:
         "MoE esparso (196B total, 11B ativos) com 256k contexto — equilibra velocidade e qualidade para textos técnicos e de nicho",
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 150,
   },
} as const satisfies Record<string, ModelPreset>;

// ─── Edit Models ──────────────────────────────────────────────────────────────
// Used by: inlineEditAgent, aiCommandStream (inline commands)
// Purpose: Execute AI inline commands on selected text ("improve", "shorten", etc.)

export const EDIT_MODELS = {
   "openrouter/openai/gpt-oss-20b": {
      label: "GPT-OSS-20B",
      provider: "OpenAI",
      description:
         'Segue instruções de edição com precisão e velocidade — ideal para comandos como "ajuste o tom", "torne mais persuasivo" ou "corrija a gramática"',
      temperature: 0.4,
      topP: 0.9,
      maxTokens: 2048,
      default: true,
   },
   "openrouter/z-ai/glm-4.7-flash": {
      label: "GLM 4.7 Flash",
      provider: "Z.ai",
      description:
         "30B SOTA com ótimo custo — excelente para edições que exigem raciocínio sobre estrutura, como reorganizar seções ou reescrever com nova perspectiva",
      temperature: 0.45,
      topP: 0.9,
      maxTokens: 2048,
   },
} as const satisfies Record<string, ModelPreset>;

// ─── Backwards-compatible unified registry ────────────────────────────────────
// Merges all catalogs so existing code using AVAILABLE_MODELS still works.

export const AVAILABLE_MODELS = {
   ...CONTENT_MODELS,
   ...AUTOCOMPLETE_MODELS,
   ...EDIT_MODELS,
} as const;

export type ContentModelId = keyof typeof CONTENT_MODELS;
export type AutocompleteModelId = keyof typeof AUTOCOMPLETE_MODELS;
export type EditModelId = keyof typeof EDIT_MODELS;
export type ModelId = keyof typeof AVAILABLE_MODELS;

export const DEFAULT_CONTENT_MODEL_ID: ContentModelId =
   "openrouter/moonshotai/kimi-k2.5";
export const DEFAULT_AUTOCOMPLETE_MODEL_ID: AutocompleteModelId =
   "openrouter/openai/gpt-oss-20b";
export const DEFAULT_EDIT_MODEL_ID: EditModelId =
   "openrouter/openai/gpt-oss-20b";

/** Legacy alias kept for back-compat */
export const DEFAULT_MODEL_ID: ModelId = DEFAULT_CONTENT_MODEL_ID;

/**
 * Look up a model preset, falling back to the given default if not found.
 */
export function getModelPreset<T extends Record<string, ModelPreset>>(
   models: T,
   id: string | undefined,
   defaultId: keyof T,
): T[keyof T] {
   return (
      id !== undefined && id in models
         ? models[id as keyof T]
         : models[defaultId]
   ) as T[keyof T];
}
