# Arandu AI — Chat Global no Context Panel

**Data:** 2026-02-25
**Issue:** #609

---

## Visão Geral

Implementar o chat de IA **Arandu AI** dentro da aba Chat do context panel global, no estilo da UI do PostHog AI (Max). Tela home com welcome screen, composer e chats recentes — sem thread view por enquanto.

---

## Nome do Assistente

**Arandu AI** — do Guarani, significa "sabedoria luminosa" (ara = luz/céu + ndu = sentir/pensar). Remete a conteúdo, criatividade e felicidade.

---

## Escopo

### O que está incluído nesta issue
- Tela home estilo PostHog dentro da aba Chat do context panel
- Composer funcional (envia mensagem → inicia nova thread no Mastra)
- Seção "Chats recentes" carregando dados reais via Mastra memory
- API endpoint `/api/chat` via TanStack Router (mesmo padrão do `/api/auth`)
- Scoping de threads por `${teamId}:${userId}`

### O que NÃO está incluído (próximas issues)
- Thread view (visão da conversa — navegar dentro de uma thread)
- Injeção de contexto da página
- "Ver todos" (lista completa de threads)
- Rename/Archive/Delete de threads

---

## Layout Visual

```
┌─────────────────────────────────┐
│  💬  Chat          [×]          │  ← header do context panel (já existe)
├─────────────────────────────────┤
│                                 │
│           ✦                     │
│        Arandu AI                │  ← text-xl font-semibold
│  Como posso te ajudar hoje?     │  ← text-sm text-muted-foreground
│                                 │
│  ┌───────────────────────────┐  │
│  │ Faça uma pergunta...      │  │  ← composer (ThreadPrimitive.Composer)
│  │                         → │  │
│  └───────────────────────────┘  │
│                                 │
│                                 │
│                                 │
│  Chats recentes      Ver todos  │  ← bottom section
│  · Artigo sobre TypeScript  2h  │
│  · Otimizar SEO da landing  1d  │
│  · Estratégia de conteúdo   3d  │
└─────────────────────────────────┘
```

A tela home é renderizada via `ThreadPrimitive.Empty` — aparece quando não há conversa ativa.

---

## Arquitetura

### Fluxo de dados

```
[Context Panel Chat Tab]
        │
        ▼
AssistantRuntimeProvider
  └── useChatRuntime({
        transport: AssistantChatTransport({ api: "/api/chat" })
      })
        │
        ▼
POST /api/chat  ←── TanStack Router API route (apps/web/src/routes/api/chat/$.ts)
        │
        ├── Autenticação via getSession()
        ├── Valida threadId + teamId do body
        ├── resourceId = `${teamId}:${userId}`
        │
        ▼
mastra.getAgent("unifiedContent").stream(messages, {
  memory: { resource: resourceId, thread: threadId }
})
        │
        ▼
toAISdkFormat() → createUIMessageStreamResponse()
```

### Persistência de threads

Mastra já tem `PostgresStore` configurado em `packages/agents/src/mastra/index.ts`:

```typescript
const mastraStorage = new PostgresStore({
  id: "mastra-storage",
  connectionString: serverEnv.PG_VECTOR_URL,
});
```

Ao passar `memory.resource` e `memory.thread` no `agent.stream()`, o Mastra salva automaticamente todas as mensagens nas suas próprias tabelas (`mastra_threads`, `mastra_messages`). **Nenhuma lógica manual de persistência necessária.**

### Scoping de threads

Alinhado com PostHog (team + user):

```typescript
const resourceId = `${teamId}:${userId}`;
// Garante isolamento: usuário A no time 1 ≠ usuário A no time 2
// E: usuário A no time 1 ≠ usuário B no time 1
```

---

## Arquivos

### Criar

| Arquivo | Descrição |
|---------|-----------|
| `apps/web/src/routes/api/chat/$.ts` | API endpoint de streaming (TanStack Router) |
| `apps/web/src/components/assistant-ui/thread.tsx` | Thread component (instalar via shadcn) |
| `apps/web/src/features/context-panel/ui/arandu-chat-tab.tsx` | Tab com runtime + Thread |

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `apps/web/src/features/context-panel/context-panel.tsx` | Substituir placeholder pelo `AranduChatTab` |
| `apps/web/src/integrations/orpc/router/chat.ts` | Adicionar `getRecentThreads` via Mastra memory |

### Deletar

| Arquivo | Motivo |
|---------|--------|
| `apps/web/src/layout/editor/hooks/use-contentta-runtime.ts` | Deprecated — substituído pelo `AssistantChatTransport` |
| `packages/database/src/schemas/chat.ts` | Tabelas `chat_session` + `chat_message` substituídas pelo Mastra storage |
| `packages/database/src/repositories/chat-repository.ts` | Sem consumidores após remoção do `getChatHistory` |
| `apps/web/src/integrations/orpc/router/chat.ts` | `getChatHistory` deprecated — substituído por `getRecentThreads` via Mastra |
| `apps/web/__tests__/integrations/orpc/router/chat.test.ts` | Testes do router deprecated |

### Atualizar (limpeza de referências)

| Arquivo | Mudança |
|---------|---------|
| `packages/database/src/schema.ts` | Remover `export * from "./schemas/chat"` |
| `apps/web/__tests__/helpers/mock-factories.ts` | Remover import `ChatMessage` + constante `CHAT_SESSION_ID` |

### Migration de banco

Dropar via `bun run db:push` após remover o schema:
- Tabelas: `chat_session`, `chat_message`
- Enums: `chat_message_role`, `chat_mode`, `chat_message_type`

> ⚠️ **Não confundir** com os eventos de analytics `ai.chat_message` em `packages/events/src/ai.ts` e `event-views.ts` — são nomes de eventos PostHog, não tabelas DB. **Não deletar.**

---

## Implementação Detalhada

### 1. Instalar Thread component

```bash
npx shadcn@latest add https://r.assistant-ui.com/thread.json
```

Isso cria `apps/web/src/components/assistant-ui/thread.tsx` com todos os primitivos necessários.

### 2. API Route `/api/chat`

```typescript
// apps/web/src/routes/api/chat/$.ts
import { mastra } from "@packages/agents";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStreamResponse, toAISdkFormat } from "ai";
import { getSession } from "@/integrations/better-auth/auth-server";

export const Route = createFileRoute("/api/chat/$")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getSession(request);
        if (!session) return new Response("Unauthorized", { status: 401 });

        const { messages, threadId, teamId } = await request.json();
        const resourceId = `${teamId}:${session.user.id}`;

        const agent = mastra.getAgent("unifiedContent");
        const result = await agent.stream(messages, {
          memory: { resource: resourceId, thread: threadId },
        });

        return createUIMessageStreamResponse(result.toAISdkFormat());
      },
    },
  },
});
```

### 3. `arandu-chat-tab.tsx`

```typescript
// apps/web/src/features/context-panel/ui/arandu-chat-tab.tsx
import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider, useChatRuntime } from "@assistant-ui/react";
import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";
import { useId } from "react";

export function AranduChatTab() {
  const { teamId } = useParams({ strict: false });
  const threadId = useId(); // novo thread por mount — trocar por estado persistido depois

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
      body: { teamId, threadId },
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}
```

### 4. `ThreadPrimitive.Empty` — tela home

No `thread.tsx` customizado, o `ThreadEmpty` renderiza:

```tsx
function ThreadEmpty() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 gap-3">
      {/* Welcome header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-2xl">✦</span>
        <h2 className="text-xl font-semibold">Arandu AI</h2>
        <p className="text-sm text-muted-foreground">
          Como posso te ajudar hoje?
        </p>
      </div>
      {/* Composer já é renderizado pelo Thread fora do Empty */}
    </div>
  );
}
```

### 5. oRPC `getRecentThreads`

```typescript
// apps/web/src/integrations/orpc/router/chat.ts
export const getRecentThreads = protectedProcedure
  .input(z.object({ teamId: z.string().uuid(), limit: z.number().int().min(1).max(20).default(5) }))
  .handler(async ({ context, input }) => {
    const { mastra } = await import("@packages/agents");
    const resourceId = `${input.teamId}:${context.userId}`;

    const threads = await mastra.memory.getThreadsByResourceId({ resourceId });

    return threads
      .slice(0, input.limit)
      .map((t) => ({
        id: t.id,
        title: t.title ?? "Nova conversa",
        updatedAt: t.updatedAt,
      }));
  });
```

### 6. Seção "Chats recentes" no `ThreadEmpty`

```tsx
function RecentChats({ teamId }: { teamId: string }) {
  const { data: threads } = useSuspenseQuery(
    orpc.chat.getRecentThreads.queryOptions({ input: { teamId, limit: 5 } })
  );

  if (threads.length === 0) return null;

  return (
    <div className="w-full mt-auto px-3 pb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">Chats recentes</span>
        <button className="text-xs text-muted-foreground hover:text-foreground">Ver todos</button>
      </div>
      <ul className="space-y-1">
        {threads.map((thread) => (
          <li key={thread.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer text-sm">
            <span className="truncate">{thread.title}</span>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {formatRelativeTime(thread.updatedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Packages a Instalar

```bash
# assistant-ui core (instala @assistant-ui/react + @assistant-ui/react-ai-sdk)
npx shadcn@latest add https://r.assistant-ui.com/thread.json
```

---

## O que NÃO muda

- A lógica do AI Chat do editor (Plate.js + AIChatPlugin + ORPCChatTransport) continua intacta por enquanto
- O `unifiedContent` agent não precisa de alterações
- O `PostgresStore` já está configurado — nenhuma migration necessária
