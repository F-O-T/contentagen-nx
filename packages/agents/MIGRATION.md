# Agent Architecture Migration Guide

## Overview

Contentta is migrating from an orchestrator + sub-agent pattern to a unified agent architecture.

**Before:**
- 1 orchestrator agent
- 5 sub-agents (planner, researcher, writer, seoAuditor, reviewer)
- ~30% overhead from delegation and coordination

**After:**
- 1 unified content agent with all workflows
- Direct access to 40+ tools
- 30% faster, simpler to maintain

## Timeline

### Phase 1: Parallel Operation (Current)
- Both agents available
- `orchestratorAgent` marked deprecated
- `unifiedContentAgent` available for testing
- Frontend can switch between agents via feature flag

### Phase 2: Migration (2 weeks)
- Monitor unified agent performance
- Migrate all frontend calls to unified agent
- Update documentation and examples

### Phase 3: Cleanup (After 2 weeks)
- Remove orchestrator and sub-agents
- Remove old agent files
- Update all references

## Usage

### Old Pattern (Deprecated)

```typescript
const agent = mastra.getAgent("orchestratorAgent");
const result = await agent.generate("Write a post about X", { requestContext });
```

### New Pattern (Recommended)

```typescript
const agent = mastra.getAgent("unifiedContent");
const result = await agent.generate("Write a post about X", { requestContext });
```

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Latency** | 2-3 roundtrips | 1 roundtrip |
| **Token Usage** | +30% overhead | 30% reduction |
| **Maintenance** | 6 files | 1 file |
| **Debugging** | Track delegation chain | Linear flow |
| **Tool Access** | Limited by sub-agent | All tools available |

## Workflows

The unified agent supports 5 workflows:

1. **Planning** - Structure, outlines, briefings
2. **Research** - SERPs, competitors, data collection
3. **Writing** - Complete articles with frontmatter
4. **SEO Audit** - Analysis and optimization
5. **Review** - Quality checks and feedback

See `unified-content-agent.ts` for detailed workflow instructions.

## Specialized Agents (Kept Separate)

- **FIM Agent** - Autocomplete and fill-in-the-middle
- **Inline Edit Agent** - Real-time inline editing

These remain separate as they serve different contexts.
