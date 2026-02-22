# AI Settings — Expanded Models & Generation Presets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the AI settings system with 3 dedicated model categories (content, autocomplete, edit), add generation parameter presets per model (temperature, topP, maxTokens, etc.), surface them as configurable overrides in AIDefaultsSchema, and reflect them correctly in the agents and UI.

**Architecture:** Model presets live in `packages/agents/src/models.ts` (code, not DB). `AIDefaultsSchema` gains an `autocompleteModel` field and optional temperature-override fields — all stored in the existing `aiDefaults` JSONB column. `createRequestContext` propagates the generation params down to the Mastra agents. The UI gets a new Autocomplete section and per-category temperature sliders.

**Tech Stack:** TypeScript, Zod, Drizzle JSONB, Mastra, TanStack Query, Radix Select/Slider

---

## Task 1: Expand `models.ts` with typed presets and model catalogs

**Files:**
- Modify: `packages/agents/src/models.ts`

### Step 1: Replace the file content

```typescript
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
   "openrouter/x-ai/grok-4.1-fast": {
      label: "Grok 4.1 Fast",
      provider: "xAI",
      description:
         "Tool calling de alto desempenho — ideal para o agente executar workflows de pesquisa SERP e geração de conteúdo estruturado",
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 8192,
      frequencyPenalty: 0.3,
      presencePenalty: 0.1,
      default: true,
   },
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
   "openrouter/bytedance-seed/seed-1.6-flash": {
      label: "Seed 1.6 Flash",
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
         "1M de contexto com baixo custo — consegue \"ver\" o artigo inteiro ao sugerir a próxima frase, mantendo consistência com o que já foi escrito",
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
         "Segue instruções de edição com precisão e velocidade — ideal para comandos como \"ajuste o tom\", \"torne mais persuasivo\" ou \"corrija a gramática\"",
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
   "openrouter/x-ai/grok-4.1-fast": {
      label: "Grok 4.1 Fast",
      provider: "xAI",
      description:
         "Máxima qualidade para edições complexas — melhor opção quando o comando envolve múltiplas dimensões (tom + estrutura + SEO simultaneamente)",
      temperature: 0.5,
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
   "openrouter/x-ai/grok-4.1-fast";
export const DEFAULT_AUTOCOMPLETE_MODEL_ID: AutocompleteModelId =
   "openrouter/openai/gpt-oss-20b";
export const DEFAULT_EDIT_MODEL_ID: EditModelId =
   "openrouter/openai/gpt-oss-20b";

/** Legacy alias kept for back-compat */
export const DEFAULT_MODEL_ID: ModelId = DEFAULT_CONTENT_MODEL_ID;

/**
 * Look up a model preset, falling back to the given default if not found.
 */
export function getModelPreset<T extends ModelPreset>(
   models: Record<string, T>,
   id: string | undefined,
   defaultId: string,
): T {
   return (id && id in models ? models[id as keyof typeof models] : models[defaultId as keyof typeof models]) as T;
}
```

### Step 2: Verify no TS errors from models.ts alone

Run: `bun run typecheck 2>&1 | head -30`

### Step 3: Commit

```bash
git add packages/agents/src/models.ts
git commit -m "feat(agents): expand model catalog with presets for content, autocomplete, and edit categories"
```

---

## Task 2: Update `CustomRequestContext` and `createRequestContext` to propagate generation params

**Files:**
- Modify: `packages/agents/src/mastra/index.ts`

### Step 1: Add generation params to the type and setter

The new `CustomRequestContext` adds optional `temperature`, `topP`, `maxTokens`, `frequencyPenalty`, `presencePenalty` fields. `createRequestContext` sets them when provided.

```typescript
export type CustomRequestContext = {
   brandId?: string;
   userId: string;
   writerId?: string;
   model?: ModelId;
   language?: string;
   writerInstructions?: InstructionMemoryItem[];
   // Generation parameter overrides (from model preset or user setting)
   temperature?: number;
   topP?: number;
   maxTokens?: number;
   frequencyPenalty?: number;
   presencePenalty?: number;
};
```

In `createRequestContext`, after the existing `if (context.model)` block, add:

```typescript
if (context.temperature !== undefined) {
   requestContext.set("temperature", context.temperature);
}
if (context.topP !== undefined) {
   requestContext.set("topP", context.topP);
}
if (context.maxTokens !== undefined) {
   requestContext.set("maxTokens", context.maxTokens);
}
if (context.frequencyPenalty !== undefined) {
   requestContext.set("frequencyPenalty", context.frequencyPenalty);
}
if (context.presencePenalty !== undefined) {
   requestContext.set("presencePenalty", context.presencePenalty);
}
```

### Step 2: Commit

```bash
git add packages/agents/src/mastra/index.ts
git commit -m "feat(agents): propagate generation params through RequestContext"
```

---

## Task 3: Update `AIDefaultsSchema` in `product-settings.ts`

**Files:**
- Modify: `packages/database/src/schemas/product-settings.ts`

### Step 1: Replace the enum values for `contentModel` and `editModel`, add `autocompleteModel`, and add optional temperature overrides

Replace the `AIDefaultsSchema` definition (lines 33-62) with:

```typescript
export const AIDefaultsSchema = z.object({
   defaultLanguage: z.enum(["pt-BR", "en-US", "es"]).optional(),
   contentModel: z
      .enum([
         "openrouter/x-ai/grok-4.1-fast",
         "openrouter/google/gemini-3-flash-preview",
         "openrouter/openai/gpt-oss-120b",
         "openrouter/openai/gpt-oss-20b",
         "openrouter/moonshotai/kimi-k2.5",
         "openrouter/minimax/minimax-m2.5",
         "openrouter/z-ai/glm-5",
         "openrouter/bytedance-seed/seed-1.6-flash",
         "openrouter/liquid/lfm2-8b-a1b",
      ])
      .optional(),
   autocompleteModel: z
      .enum([
         "openrouter/openai/gpt-oss-20b",
         "openrouter/liquid/lfm2-8b-a1b",
         "openrouter/liquid/lfm-2.2-6b",
         "openrouter/google/gemini-2.5-flash-lite",
         "openrouter/stepfun/step-3.5-flash",
      ])
      .optional(),
   editModel: z
      .enum([
         "openrouter/openai/gpt-oss-20b",
         "openrouter/z-ai/glm-4.7-flash",
         "openrouter/x-ai/grok-4.1-fast",
      ])
      .optional(),
   // Optional per-category temperature overrides (override model preset)
   contentTemperature: z.number().min(0).max(2).optional(),
   contentMaxTokens: z.number().int().positive().optional(),
   autocompleteTemperature: z.number().min(0).max(2).optional(),
   editTemperature: z.number().min(0).max(2).optional(),
   // Search settings (unchanged)
   searchDepth: z.enum(["basic", "advanced"]).optional(),
   searchMaxResults: z.number().int().positive().optional(),
   includeSearchAnswer: z.boolean().optional(),
   searchTimeRange: z.enum(["day", "week", "month", "year", "all"]).optional(),
   preferredSearchProvider: z.enum(["tavily", "exa", "firecrawl"]).optional(),
   requireAuthoritativeSources: z.boolean().optional(),
   minCredibility: z.enum(["high", "medium", "low"]).optional(),
   ragMaxResults: z.number().int().positive().optional(),
   ragMinScore: z.number().min(0).max(1).optional(),
   ragEnabled: z.boolean().optional(),
   maxChatTokens: z.number().int().positive().optional(),
   maxReasoningSteps: z.number().int().positive().optional(),
   imageGenerationModel: z
      .enum(["sourceful/riverflow-v2-pro", "bytedance-seed/seedream-4.5"])
      .optional(),
});
```

### Step 2: Push schema (no migration needed — JSONB)

Run: `bun run db:push` — should say "no changes" since it's JSONB

### Step 3: Commit

```bash
git add packages/database/src/schemas/product-settings.ts
git commit -m "feat(database): expand AIDefaultsSchema with autocompleteModel, expanded model enums, and temperature overrides"
```

---

## Task 4: Update `fim-agent.ts` to accept model from requestContext

**Files:**
- Modify: `packages/agents/src/mastra/agents/fim-agent.ts`

### Step 1: Replace static model string with dynamic resolver

The agent currently has `model: "openrouter/mistralai/mistral-small-creative"` hardcoded.
Change it to read from requestContext, falling back to `DEFAULT_AUTOCOMPLETE_MODEL_ID`:

```typescript
import { Agent } from "@mastra/core/agent";
import { DEFAULT_AUTOCOMPLETE_MODEL_ID } from "../../models";

export const fimAgent: Agent = new Agent({
   id: "fim-agent",
   name: "FIM Completion Agent",

   model: ({ requestContext }) => {
      return (
         (requestContext?.get("model") as string) ??
         DEFAULT_AUTOCOMPLETE_MODEL_ID
      );
   },

   instructions: () => `...` // keep existing instructions unchanged
});
```

### Step 2: Update `inline-edit-agent.ts` similarly

`inline-edit-agent.ts` also has `model: "openrouter/mistralai/mistral-small-creative"` hardcoded.
Change it to read from requestContext:

```typescript
import { Agent } from "@mastra/core/agent";
import { DEFAULT_EDIT_MODEL_ID } from "../../models";

export const inlineEditAgent: Agent = new Agent({
   id: "inline-edit-agent",
   name: "Inline Edit Agent",

   model: ({ requestContext }) => {
      return (
         (requestContext?.get("model") as string) ??
         DEFAULT_EDIT_MODEL_ID
      );
   },

   // keep existing instructions unchanged
   tools: {},
});
```

### Step 3: Commit

```bash
git add packages/agents/src/mastra/agents/fim-agent.ts packages/agents/src/mastra/agents/inline-edit-agent.ts
git commit -m "feat(agents): fim-agent and inline-edit-agent resolve model from requestContext"
```

---

## Task 5: Update `agent.ts` router to use new fields

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/agent.ts`

### Step 1: Import the new catalogs and helper

Add to imports:
```typescript
import {
   CONTENT_MODELS,
   AUTOCOMPLETE_MODELS,
   EDIT_MODELS,
   DEFAULT_CONTENT_MODEL_ID,
   DEFAULT_AUTOCOMPLETE_MODEL_ID,
   DEFAULT_EDIT_MODEL_ID,
   getModelPreset,
   type ContentModelId,
   type AutocompleteModelId,
   type EditModelId,
} from "@packages/agents/models";
```

Remove the existing `import type { ModelId } from "@packages/agents/models";` (it still exists in AVAILABLE_MODELS so it won't break, but we'll use the more specific types).

### Step 2: Update `copilotStream` to use `autocompleteModel` + preset

Replace the `createRequestContext` call in `copilotStream`:

```typescript
// Get autocomplete model and its preset
const autocompleteModelId = (aiDefaults.autocompleteModel ?? DEFAULT_AUTOCOMPLETE_MODEL_ID) as AutocompleteModelId;
const autocompletePreset = getModelPreset(AUTOCOMPLETE_MODELS, autocompleteModelId, DEFAULT_AUTOCOMPLETE_MODEL_ID);

const requestContext = createRequestContext({
   userId,
   language:
      aiDefaults.defaultLanguage ??
      getRequestLanguage(headers) ??
      "pt-BR",
   model: autocompleteModelId,
   // Use user override if set, otherwise fall back to model preset
   temperature: aiDefaults.autocompleteTemperature ?? autocompletePreset.temperature,
   topP: autocompletePreset.topP,
   maxTokens: autocompletePreset.maxTokens,
} as CustomRequestContext);
```

### Step 3: Update `aiCommandStream` to use `contentModel` + preset

Replace the `createRequestContext` call in `aiCommandStream`:

```typescript
const contentModelId = ((input.model as ContentModelId) ?? aiDefaults.contentModel ?? DEFAULT_CONTENT_MODEL_ID) as ContentModelId;
const contentPreset = getModelPreset(CONTENT_MODELS, contentModelId, DEFAULT_CONTENT_MODEL_ID);

const requestContext = createRequestContext({
   userId,
   contentId: input.contentId,
   writerId: input.writerId,
   language:
      input.language ??
      aiDefaults.defaultLanguage ??
      getRequestLanguage(headers) ??
      "pt-BR",
   model: contentModelId,
   temperature: aiDefaults.contentTemperature ?? contentPreset.temperature,
   topP: contentPreset.topP,
   maxTokens: aiDefaults.contentMaxTokens ?? contentPreset.maxTokens,
   frequencyPenalty: contentPreset.frequencyPenalty,
   presencePenalty: contentPreset.presencePenalty,
} as CustomRequestContext);
```

### Step 4: Update `executeUnifiedAgent` to use `contentModel` + preset with product settings

Fetch product settings at the top of the handler (before `enforceCreditBudget`):

```typescript
const settings = await getProductSettings(db, teamId);
const aiDefaults = settings?.aiDefaults ?? {};

const contentModelId = ((model as ContentModelId) ?? aiDefaults.contentModel ?? DEFAULT_CONTENT_MODEL_ID) as ContentModelId;
const contentPreset = getModelPreset(CONTENT_MODELS, contentModelId, DEFAULT_CONTENT_MODEL_ID);
```

Replace the `createRequestContext` call:

```typescript
const requestContext = createRequestContext({
   userId,
   brandId,
   writerId,
   model: contentModelId,
   language: aiDefaults.defaultLanguage ?? "pt-BR",
   writerInstructions,
   temperature: aiDefaults.contentTemperature ?? contentPreset.temperature,
   topP: contentPreset.topP,
   maxTokens: aiDefaults.contentMaxTokens ?? contentPreset.maxTokens,
   frequencyPenalty: contentPreset.frequencyPenalty,
   presencePenalty: contentPreset.presencePenalty,
} as CustomRequestContext);
```

Also update the `model` reference in `emitAiAgentAction` to use `contentModelId`.

### Step 5: Commit

```bash
git add apps/web/src/integrations/orpc/router/agent.ts
git commit -m "feat(orpc): apply model presets and autocompleteModel in agent router procedures"
```

---

## Task 6: Update `ai-agents.tsx` UI

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/ai-agents.tsx`

### Step 1: Update imports

Replace:
```typescript
import { AVAILABLE_MODELS } from "@packages/agents/models";
```

With:
```typescript
import {
   CONTENT_MODELS,
   AUTOCOMPLETE_MODELS,
   EDIT_MODELS,
} from "@packages/agents/models";
```

Also add `Slider` to `@packages/ui/components/slider` imports and `Zap` to lucide imports.

### Step 2: Rewrite `ModelSelectionSection`

The new signature accepts all 3 models plus optional temperature overrides:

```typescript
function ModelSelectionSection({
   currentContentModel,
   currentAutocompleteModel,
   currentEditModel,
   currentContentTemperature,
   currentAutocompleteTemperature,
   currentEditTemperature,
   currentContentMaxTokens,
}: {
   currentContentModel: string | undefined;
   currentAutocompleteModel: string | undefined;
   currentEditModel: string | undefined;
   currentContentTemperature: number | undefined;
   currentAutocompleteTemperature: number | undefined;
   currentEditTemperature: number | undefined;
   currentContentMaxTokens: number | undefined;
})
```

**Content model subsection** renders a `<Select>` with all entries from `Object.entries(CONTENT_MODELS)` plus a temperature slider (0–2, step 0.05) and a maxTokens input.

**Autocomplete model subsection** renders a `<Select>` with all entries from `Object.entries(AUTOCOMPLETE_MODELS)` plus a temperature slider.

**Edit model subsection** renders a `<Select>` with all entries from `Object.entries(EDIT_MODELS)` plus a temperature slider.

**Temperature slider pattern:**
```tsx
<div className="space-y-2">
   <div className="flex items-center justify-between">
      <Label>Temperatura</Label>
      <span className="text-sm text-muted-foreground tabular-nums">{temp.toFixed(2)}</span>
   </div>
   <p className="text-xs text-muted-foreground">
      Baixa = consistente · Alta = criativo (preset do modelo: {preset.temperature})
   </p>
   <Slider
      min={0}
      max={2}
      step={0.05}
      value={[temp]}
      onValueChange={([v]) => setTemp(v)}
   />
</div>
```

Show the model's description from the preset below the select as a `<p className="text-xs text-muted-foreground">`.

### Step 3: Update `hasChanged` logic and `saveMutation.mutate` call

`hasChanged` now covers all 7 fields.

`saveMutation.mutate({
   contentModel,
   autocompleteModel,
   editModel,
   contentTemperature: contentTemp,
   autocompleteTemperature: autocompleteTemp,
   editTemperature: editTemp,
   contentMaxTokens,
})`

### Step 4: Update `AiAgentsContent` to pass new props

```tsx
<ModelSelectionSection
   currentContentModel={settings?.aiDefaults?.contentModel}
   currentAutocompleteModel={settings?.aiDefaults?.autocompleteModel}
   currentEditModel={settings?.aiDefaults?.editModel}
   currentContentTemperature={settings?.aiDefaults?.contentTemperature}
   currentAutocompleteTemperature={settings?.aiDefaults?.autocompleteTemperature}
   currentEditTemperature={settings?.aiDefaults?.editTemperature}
   currentContentMaxTokens={settings?.aiDefaults?.contentMaxTokens}
/>
```

### Step 5: Commit

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/ai-agents.tsx
git commit -m "feat(ui): expand AI settings with autocomplete model, edit model, and per-category temperature sliders"
```

---

## Task 7: Verify Slider component exists

**Before Task 6 Step 1**, check if `@packages/ui/components/slider` exists.

Run: `ls packages/ui/src/components/ | grep slider`

If it does not exist, use `Input type="range"` as fallback with min/max/step attributes instead of `Slider`.

---

## Task 8: Typecheck

Run: `bun run typecheck`

Fix any type errors found. Common ones:
- `contentModel` enum in `AIDefaultsSchema` may clash with router `ModelId` type — use `as ContentModelId` cast at call sites
- `getModelPreset` return type — ensure it's typed correctly

---

## Execution Handoff

Plan saved. Two execution options:

**1. Subagent-Driven (this session)** — dispatch fresh subagent per task, review between tasks

**2. Parallel Session (separate)** — open new session with executing-plans, batch execution with checkpoints
