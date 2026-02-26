# Agent Architecture Migration Guide

## Overview

Contentta uses a two-phase agent architecture strategy.

---

## Phase 1: Monolith → Unified Agent (Completed)

**Before (deprecated):**
- 1 orchestrator agent
- 5 sub-agents (planner, researcher, writer, seoAuditor, reviewer)
- ~30% overhead from delegation and coordination

**After (current in packages/):**
- 1 unified content agent with all workflows
- Direct access to 40+ tools
- 30% faster, simpler to maintain

---

## Phase 2: Unified Agent → Specialized Network (Current)

**Architecture:**
- 1 router agent (`contentNetworkAgent`) registered as `"unifiedContent"`
- 4 specialized sub-agents via Mastra's native `agents` config + `.network()` API
- Public API unchanged: `mastra.getAgent("unifiedContent")` still works

**Agents:**

| Agent | Key | Workflows |
|-------|-----|-----------|
| Content Network Agent (router) | `unifiedContent` | Routes to specialists |
| Research & Planning Agent | `researchAgent` | Research, Planning |
| Writer & Editor Agent | `writerAgent` | Writing, Editing |
| SEO Auditor Agent | `seoAuditorAgent` | SEO Audit |
| Content Reviewer Agent | `reviewerAgent` | Review |

**How Mastra network works:**
```typescript
// Router agent config:
const contentNetworkAgent = new Agent({
  agents: { "research-agent": researchAgent, ... },
  // No tools — delegates to sub-agents
});

// Called via standard .stream() / .generate() — no API change needed
const agent = mastra.getAgent("unifiedContent");
const result = await agent.stream([...], { requestContext });
```

**Files:**
```
packages/agents/src/mastra/
├── agents/
│   ├── content-network-agent.ts        ← Router (registered as "unifiedContent")
│   ├── specialized/
│   │   ├── research-agent.ts           ← Research + Planning
│   │   ├── writer-agent.ts             ← Writing + Editing
│   │   ├── seo-auditor-agent.ts        ← SEO Audit
│   │   └── reviewer-agent.ts           ← Review
│   ├── unified-content-agent.ts        ← Kept as reference (not imported)
│   ├── fim-agent.ts                    ← Unchanged
│   └── inline-edit-agent.ts            ← Unchanged
└── index.ts                            ← Mastra instance
```

## Benefits

| Aspect | Unified Agent | Network |
|--------|--------------|---------|
| **Context window** | 40+ tools always loaded | 10-15 tools per specialist |
| **Focus** | Generic | Domain-specific |
| **Maintenance** | 1 large file | 4 focused files |
| **Debugging** | Linear flow | Clear agent boundaries |
| **Extensibility** | Harder (one agent) | Add new specialist easily |

## Specialized Agents (Always Separate)

- **FIM Agent** (`fimAgent`) — Autocomplete and fill-in-the-middle
- **Inline Edit Agent** (`inlineEditAgent`) — Real-time inline editing
