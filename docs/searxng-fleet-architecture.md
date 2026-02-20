# SearXNG Fleet Manager — Arquitetura Separada

## Visão Geral

Esta especificação detalha a implementação de um **app separado** (`apps/fleet/`) para gerenciar o pool de instâncias SearXNG e Firecrawl self-hosted, isolado do worker existente.

---

## Motivação

O sistema atual depende 100% de APIs externas pagas (Tavily, Exa, Firecrawl cloud). A proposta é substituir por soluções self-hosted com:

- **SearXNG** — metabuscador open-source para SERP search
- **Firecrawl self-hosted** — para deep crawling com Playwright

O fleet manager precisa ser **separado do worker** para:
- Independência de deploy (pode escalar independente)
- Isolamento de responsabilidades (ciclo de vida de instâncias ≠ jobs de billing)
- Facilidade de monitoring e manutenção

---

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              apps/fleet/                                 │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                       │
│  │  SearXNG Fleet      │  │  Firecrawl Fleet    │                       │
│  │  Manager            │  │  Manager            │                       │
│  │                     │  │                     │                       │
│  │  - Railway API      │  │  - Railway API      │                       │
│  │  - Pool State       │  │  - Pool State       │                       │
│  │  - Health Checks    │  │  - Health Checks    │                       │
│  └─────────┬───────────┘  └─────────┬───────────┘                       │
│            │                        │                                    │
│            ▼                        ▼                                    │
│  ┌─────────────────────────────────────────────┐                         │
│  │              BullMQ Workers                  │                         │
│  │                                              │                         │
│  │  - searxng-fleet (provision/teardown)       │                         │
│  │  - searxng-search (load balance)            │                         │
│  │  - firecrawl-fleet (provision/teardown)     │                         │
│  │  - firecrawl-crawl (load balance)           │                         │
│  └─────────────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Railway (Infra)                                 │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ searxng-001  │  │ searxng-002  │  │ searxng-003  │  (SearXNG Fleet) │
│  │ .railway.app │  │ .railway.app │  │ .railway.app │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐                                    │
│  │ firecrawl-001│  │ firecrawl-002│  (Firecrawl Self-hosted)          │
│  │ .railway.app │  │ .railway.app │                                    │
│  │ +SearXNG     │  │ +SearXNG     │                                    │
│  └──────────────┘  └──────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos

### Novo App: `apps/fleet/`

```
apps/fleet/
├── src/
│   ├── index.ts                    # Entry point
│   ├── scheduler.ts                # Cron jobs (healthcheck, ensure-min-pool)
│   │
│   ├── railway-client.ts           # Railway GraphQL API wrapper
│   │
│   ├── searxng/
│   │   ├── pool.ts                 # Redis state management
│   │   ├── fleet-manager.ts        # Provision/teardown logic
│   │   ├── providers/
│   │   │   └── searxng-provider.ts # SearchProvider impl
│   │   └── workers/
│   │       ├── searxng-fleet-worker.ts
│   │       └── searxng-search-worker.ts
│   │
│   └── firecrawl/
│       ├── pool.ts                 # Redis state management
│       ├── fleet-manager.ts        # Provision/teardown logic
│       ├── providers/
│       │   └── firecrawl-provider.ts # CrawlProvider impl
│       └── workers/
│           ├── firecrawl-fleet-worker.ts
│           └── firecrawl-crawl-worker.ts
│
├── tsconfig.json
├── package.json
└── project.json (Nx)
```

---

## Componentes Detalhados

### 1. Railway Client (`apps/fleet/src/railway-client.ts`)

Wrapper para a Railway GraphQL API:

```typescript
export class RailwayClient {
  private readonly endpoint = "https://backboard.railway.com/graphql/v2";

  async provisionService(
    image: string,
    name: string,
    variables: Record<string, string>
  ): Promise<{ serviceId: string; deploymentId: string }>;

  async destroyService(serviceId: string): Promise<void>;

  async waitForHealthy(
    serviceId: string,
    timeoutMs: number
  ): Promise<string>; // returns URL

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
}
```

**Variáveis de ambiente:**
- `RAILWAY_API_TOKEN` — workspace token
- `RAILWAY_PROJECT_ID` — projeto de destino
- `RAILWAY_ENVIRONMENT_ID` — environment ID

### 2. SearXNG Pool (`apps/fleet/src/searxng/pool.ts`)

Estado em Redis:

```
searxng:pool              → Set<instanceId>
searxng:instance:{id}     → Hash { url, status, failCount, railwayServiceId, addedAt }
searxng:healthy           → Set<instanceId> (LRU cache)
```

**Instance Status:**
- `provisioning` — criando no Railway
- `healthy` — respondendo normalmente
- `degraded` — responding but slow/high-error
- `compromised` — bot protection detectada
- `teardown` — aguardando dreno antes de destruir

### 3. SearXNG Provider (`apps/fleet/src/searxng/providers/searxng-provider.ts`)

Implementa `SearchProvider` (interface de `packages/search/src/types.ts`):

```typescript
// search() → enfileira na BullMQ e aguarda resultado
// crawl() → lança erro (SearXNG não suporta crawl)

// Detecção de bot protection:
function isBotProtected(status: number, body: string, results: unknown[]): boolean {
  if (status === 429 || status === 403) return true;
  if (results.length === 0) return true;
  if (body.toLowerCase().includes("captcha")) return true;
  if (body.toLowerCase().includes("unusual traffic")) return true;
  return false;
}
```

### 4. Firecrawl Pool (`apps/fleet/src/firecrawl/pool.ts`)

Estado em Redis:

```
firecrawl:pool            → Set<instanceId>
firecrawl:instance:{id}   → Hash { url, status, failCount, railwayServiceId, searxngBackend, addedAt }
firecrawl:healthy         → Set<instanceId>
```

Cada instância Firecrawl recebe `SEARXNG_ENDPOINT` apontando para uma instância SearXNG saudável.

### 5. BullMQ Queues

**Filas do Fleet:**

| Fila | Descrição |
|------|-----------|
| `searxng-fleet` | provision, teardown, healthcheck |
| `firecrawl-fleet` | provision, teardown, healthcheck |

**Filas de Load Balance:**

| Fila | Descrição |
|------|-----------|
| `searxng-search` | executa search em instância saudável |
| `firecrawl-crawl` | executa crawl em instância saudável |

### 6. Scheduler (`apps/fleet/src/scheduler.ts`)

```typescript
// A cada 5 minutos: health check de todas instâncias
cron.schedule("*/5 * * * *", async () => {
  await searxngFleet.healthcheck();
  await firecrawlFleet.healthcheck();
});

// A cada 10 minutos: garantir mínimo de instâncias healthy
cron.schedule("*/10 * * * *", async () => {
  await searxngFleet.ensureMinPool();
  await firecrawlFleet.ensureMinPool();
});
```

---

## Fluxo: Detecção → Failover → Teardown

```
Requisição search()
        │
        ▼
BullMQ: searxng-search job
        │
        ▼
Worker pegue instância LRU (healthy set)
        │
        ▼
GET {instance}/search?q=...&format=json
        │
        ├─► OK → retorna SearchResult[]
        │         atualiza lastUsed no Redis
        │
        └─► Bot Protection detectada
            │
            ▼
            1. Redis: instance status = compromised
            2. Redis: remove do healthy set
            3. BullMQ: enfileira "searxng-fleet:provision" (priority: 1)
            4. BullMQ: enfileira "searxng-fleet:teardown" (delay: 5min)
            │
            ▼
            [Worker processa provision]
            5. Railway: serviceCreate(image: searxng/searxng)
            6. Redis: nova instância status = provisioning
            7. Polling: await healthy
            8. Redis: status = healthy, add ao healthy set
            │
            ▼
            [Worker processa teardown após delay]
            9. Railway: serviceDelete(oldServiceId)
            10. Redis: remove instância do pool
```

---

## Integração com packages/search

O app `apps/fleet` expõe providers que são consumidos por `packages/search`:

```
packages/search/src/
├── providers/
│   ├── searxng-provider.ts    → delega para BullMQ do fleet
│   └── firecrawl-provider.ts  → delega para BullMQ do fleet
```

**Interface mantida compatível:**

```typescript
// packages/search/src/provider-selector.ts
const SEARCH_PROVIDER_ORDER = ["searxng", "tavily", "exa"];
const CRAWL_PROVIDER_ORDER  = ["firecrawl", "tavily", "exa"];
```

Os agentes continuam usando `search()` e `crawl()` sem alterações.

---

## Variáveis de Ambiente

### apps/fleet

```bash
# Railway
RAILWAY_API_TOKEN=
RAILWAY_PROJECT_ID=
RAILWAY_ENVIRONMENT_ID=

# SearXNG Fleet
SEARXNG_MIN_INSTANCES=2
SEARXNG_MAX_INSTANCES=5
SEARXNG_SECRET_KEY=

# Firecrawl Fleet
FIRECRAWL_MIN_INSTANCES=1
FIRECRAWL_MAX_INSTANCES=3
FIRECRAWL_BULL_AUTH_KEY=

# BullMQ
REDIS_URL=

# Fallback (opcionais)
TAVILY_API_KEYS=
EXA_API_KEYS=
FIRECRAWL_API_KEYS=
```

---

## Alterações Necessárias

### packages/search
- [ ] `src/types.ts` — adicionar `"searxng"` ao `ProviderId`
- [ ] `src/providers/searxng-provider.ts` — implementar delegação para BullMQ fleet
- [ ] `src/providers/firecrawl-provider.ts` — adaptar para usar fleet
- [ ] `src/provider-selector.ts` — atualizar `SEARCH_PROVIDER_ORDER` e `CRAWL_PROVIDER_ORDER`
- [ ] `src/index.ts` — exportar novos providers

### packages/environment
- [ ] `server.ts` — adicionar variáveis Railway e Fleet config

### packages/queue
- [ ] adicionar constantes: `SEARXNG_FLEET_QUEUE`, `SEARXNG_SEARCH_QUEUE`, `FIRECRAWL_FLEET_QUEUE`, `FIRECRAWL_CRAWL_QUEUE`

### apps/fleet (NOVO)
- [ ] `src/index.ts` — entry point
- [ ] `src/scheduler.ts` — cron jobs
- [ ] `src/railway-client.ts` — Railway GraphQL wrapper
- [ ] `src/searxng/pool.ts` — Redis state
- [ ] `src/searxng/fleet-manager.ts` — provision/teardown
- [ ] `src/searxng/providers/searxng-provider.ts` — search via BullMQ
- [ ] `src/searxng/workers/searxng-fleet-worker.ts`
- [ ] `src/searxng/workers/searxng-search-worker.ts`
- [ ] `src/firecrawl/pool.ts`
- [ ] `src/firecrawl/fleet-manager.ts`
- [ ] `src/firecrawl/providers/firecrawl-provider.ts`
- [ ] `src/firecrawl/workers/firecrawl-fleet-worker.ts`
- [ ] `src/firecrawl/workers/firecrawl-crawl-worker.ts`
- [ ] `package.json`, `tsconfig.json`, `project.json`

---

## Complexidade

**Alta** — múltiplos sistemas:
- Railway API para provisionamento dinâmico
- Estado distribuído em Redis
- Dois workers BullMQ (fleet + load balance) por serviço
- Detecção de bot protection com failover automático
- Zero breaking change na interface dos agentes

**Benefícios:**
- Independência de APIs externas
- Controle total sobre infraestrutura
- Escalabilidade horizontal
- Custo previsível (fixo vs. por request)