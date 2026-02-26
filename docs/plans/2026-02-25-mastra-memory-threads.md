# Mastra Memory Threads Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Instalar `@mastra/memory`, configurar no `unifiedContentAgent` para persistir conversas em threads e gerar títulos automáticos com modelo barato.

**Architecture:** `@mastra/memory` fornece a classe `Memory` que, quando configurada no `Agent`, persiste mensagens por `threadId`+`resourceId` no `PostgresStore` já existente. O Mastra injeta automaticamente o storage via `__setMastraInstance` ao registrar o agente. O `generateTitle` roda de forma assíncrona (não bloqueia a resposta) usando `openrouter/google/gemini-2.5-flash-lite`.

**Tech Stack:** `@mastra/memory@1.5.1`, `@mastra/core@1.7.0`, `@mastra/pg@1.6.1`, Bun workspaces (catalog pattern)

---

### Task 1: Add `@mastra/memory` to workspace catalog and install

**Files:**
- Modify: `package.json` (root) — catalog entry
- Modify: `packages/agents/package.json` — dependency entry

**Step 1: Add to root catalog**

In `package.json`, find the `"mastra"` catalog block and add `@mastra/memory`:

```json
"mastra": {
  "@mastra/ai-sdk": "^1.0.5",
  "@mastra/memory": "1.5.1",
  "@mastra/rag": "2.1.1",
  "@mastra/core": "1.7.0",
  "@mastra/pg": "1.6.1",
  "ai": "6.0.100"
}
```

**Step 2: Add dependency to agents package**

In `packages/agents/package.json`, find the `dependencies` block and add:

```json
"@mastra/memory": "catalog:mastra"
```

**Step 3: Install**

```bash
bun install
```

Expected: installs `@mastra/memory@1.5.1` in `node_modules/@mastra/memory/`.

**Step 4: Verify install**

```bash
ls node_modules/@mastra/memory/
```

Expected: `dist/`, `package.json`, etc.

**Step 5: Commit**

```bash
git add package.json packages/agents/package.json bun.lock
git commit -m "feat(agents): add @mastra/memory dependency"
```

---

### Task 2: Configure Memory on `unifiedContentAgent`

**Files:**
- Modify: `packages/agents/src/mastra/agents/unified-content-agent.ts`

**Context:**
A classe `Memory` de `@mastra/memory` aceita `{ options: { lastMessages, generateTitle, ... } }`. O storage não precisa ser passado explicitamente — o Mastra injeta o `PostgresStore` automaticamente quando o agent é registrado na instância `Mastra`. O `generateTitle` aceita `{ model: string }` onde o modelo usa o formato `"provider/model-name"`.

**Step 1: Add Memory import at top of file**

No topo de `unified-content-agent.ts`, logo após os imports existentes, adicione:

```typescript
import { Memory } from "@mastra/memory";
```

**Step 2: Create memory instance before agent definition**

Logo antes de `export const unifiedContentAgent`, adicione:

```typescript
// ─── Memory Configuration ────────────────────────────────────────────────────

const memory = new Memory({
   options: {
      lastMessages: 30,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});
```

**Step 3: Add memory to agent constructor**

No `new Agent({ ... })`, adicione `memory` após a propriedade `instructions`:

```typescript
export const unifiedContentAgent: Agent = new Agent({
   id: "unified-content-agent",
   // ... demais props ...
   memory,
   tools: { ... },
});
```

**Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: sem erros de tipo. Se `Memory` não for reconhecido, verifique que `bun install` foi executado na task 1.

**Step 5: Commit**

```bash
git add packages/agents/src/mastra/agents/unified-content-agent.ts
git commit -m "feat(agents): configure Mastra Memory with thread persistence and title generation"
```

---

### Task 3: Verify `getRecentThreads` router is correct

**Files:**
- Read: `apps/web/src/integrations/orpc/router/chat.ts`

**Context:**
O router `getRecentThreads` já usa a API correta: `storage.getStore("memory").listThreads(...)`. Verificar que os parâmetros correspondem ao tipo `StorageListThreadsInput`.

**Step 1: Review the current implementation**

Leia `apps/web/src/integrations/orpc/router/chat.ts` e verifique que:
- `filter: { resourceId }` — filtra pelo `${teamId}:${userId}` ✅
- `perPage: input.limit` — limita resultados ✅
- `orderBy: { field: "updatedAt", direction: "DESC" }` — mais recentes primeiro ✅
- `result.threads.map(...)` — mapeia para `{ id, title, updatedAt }` ✅

Se algum parâmetro estiver diferente dos tipos `ThreadOrderBy = 'createdAt' | 'updatedAt'` e `ThreadSortDirection = 'ASC' | 'DESC'`, corrija.

**Step 2: Verify chat API route passes memory correctly**

Leia `apps/web/src/routes/api/chat/$.ts` e verifique que o `agent.stream()` usa:

```typescript
const stream = await agent.stream(messages, {
   memory: { resource: resourceId, thread: threadId },
});
```

Onde `resource` é `"${teamId}:${userId}"` e `thread` é o UUID do thread. Este formato corresponde ao tipo `AgentMemoryOption = { thread: string, resource: string }`. ✅

**Step 3: No changes needed — commit only if fixed something**

---

### Task 4: Manual verification

**Goal:** confirmar que threads aparecem no painel após uma conversa.

**Step 1: Start dev server**

```bash
bun dev
```

**Step 2: Open Arandu chat and send a message**

1. Abra o context panel (ícone de chat)
2. Envie qualquer mensagem para o Arandu
3. Espere a resposta completa

**Step 3: Reload and check thread list**

1. Recarregue a página
2. Abra o context panel novamente
3. Verifique se o thread aparece com um título gerado automaticamente

**Step 4: Verify thread loading**

Clique num thread recente — deve carregar o histórico de mensagens (o `key={threadId}` faz o componente remontar com o threadId correto, e o `agent.stream()` carrega mensagens do storage automaticamente).

---

## Notes

- `generateTitle` roda **assíncrono** — o título pode aparecer com um pequeno delay após a primeira mensagem
- O `resourceId` = `"${teamId}:${userId}"` separa threads por time, impedindo cross-team leakage
- `lastMessages: 30` — mantém as últimas 30 mensagens no contexto
- O modelo `openrouter/google/gemini-2.5-flash-lite` é o mais barato disponível no projeto para geração de títulos
- Threads sem título aparecem como `"Nova conversa"` (fallback no router) até o título ser gerado
