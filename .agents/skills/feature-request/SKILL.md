---
name: feature-request
description: Use when receiving user feedback, feature suggestions, or improvement requests that need to be documented as GitHub issues. Triggers on customer requests, product suggestions, enhancement ideas, or when converting user feedback into tracked work.
---

# Feature Request

## Overview

Investigates the codebase to understand the current state, then creates detailed GitHub feature request issues from user feedback or product ideas. Ensures issues are actionable with technical context.

**Core principle:** Understand what EXISTS first, then document what needs to CHANGE. Never file issues without codebase context.

## When to Use

Use when:
- User feedback or suggestion needs to be tracked
- Feature request from customer support (Licitei BOT messages)
- Product improvement idea needs documentation
- Converting conversation into a trackable feature issue

Don't use when:
- It's a bug (use debug-and-report instead)
- Fix is immediate and simple (just do it)
- Issue is already well-defined (use `gh` directly)

## Workflow

### Phase 0: Understand the Request

**Parse the user feedback to extract:**
1. **Who** - User info, plan, company (for priority context)
2. **What** - The feature or improvement they want
3. **Why** - The pain point or use case driving the request
4. **Where** - Which area/flow of the product is affected

**For Licitei BOT messages**, extract structured data:
- Area tag (e.g., "melhoria do lance automatico")
- User info (email, company, plan, tenure)
- The actual suggestion text

### Phase 0.5: Search GitHub for Duplicates and Related Issues

**REQUIRED before investigating the codebase.** Always search GitHub first:

```bash
# Search for existing issues related to the request
gh issue list --search "<keywords from the request>" --limit 10
gh issue list --search "<alternative keywords>" --limit 10
gh issue list --label "feedback" --limit 10
```

Check for:
- **Duplicate issues** - Same feature already requested? Link to it instead of creating a new one
- **Related issues** - Similar requests that could be grouped or referenced
- **Closed issues** - Was this already implemented, rejected, or deferred? Check why
- **PRs in progress** - Is someone already working on this?

If a duplicate exists, comment on the existing issue with the new user's context instead of creating a new one.

### Phase 1: Full Codebase Investigation

**REQUIRED before creating the issue.** Use a Task agent with `subagent_type=Explore` to perform a **thorough, codebase-wide search**. Do NOT limit the search to obvious directories — cast a wide net to ensure maximum context.

The Explore agent MUST search:

1. **Current implementation** - How does the affected feature work today?
2. **Data model** - What Prisma models, fields, and enums are involved?
3. **UI state** - What components exist? What does the user currently see?
4. **Related mechanisms** - Are there partial implementations or workarounds?
5. **Technical constraints** - What would make this hard or easy to implement?
6. **Server-side logic** - tRPC routers, use-cases, services, workers, CRONs
7. **Cross-cutting concerns** - Constants, utils, hooks, shared components that touch this area
8. **Similar patterns** - How was a similar feature implemented elsewhere in the codebase?

**Use a Task/Explore agent** to search broadly across the entire codebase. Do not rely on guessing file paths — let the agent search with multiple keyword variations (Portuguese + English, camelCase + kebab-case + snake_case).

Document:
- File paths and line numbers
- Current behavior vs requested behavior
- Existing patterns that could be extended
- Working examples of similar features (for reference)

### Phase 2: Technical Analysis

After investigating, determine:

1. **Feasibility** - Is this straightforward, moderate, or complex?
2. **Approach options** - What are the possible implementation strategies?
3. **Affected files** - Which files would need changes?
4. **Dependencies** - Does this require new infrastructure, APIs, or models?
5. **Edge cases** - What could go wrong? What needs consideration?

### Phase 3: Create GitHub Issue

Create the issue with `gh issue create`:

```bash
gh issue create \
  --title "Clear, specific title" \
  --body "$(cat <<'EOF'
## Contexto do Usuário
- **Plano:** [plan]
- **Cliente desde:** [date]

## Solicitação
[Clear description of what the user wants, in their own words or paraphrased]

## Motivação
[Why they need this - the pain point or use case]

## Estado Atual
[How the feature works today, with file references]

### Arquivos Relevantes
- `path/to/file.ts:LINE` - [what this file does]
- `path/to/file.ts:LINE` - [related component]

### Comportamento Atual
[What happens now]

## Comportamento Desejado
[What should happen after implementation]

## Análise Técnica

### Abordagem Sugerida
[Recommended implementation approach]

### Alterações Necessárias
- [ ] [Specific change 1 with file path]
- [ ] [Specific change 2 with file path]
- [ ] [Specific change 3 with file path]

### Modelo de Dados
[Any schema changes needed, or "Nenhuma alteração necessária"]

### Complexidade
[Baixa / Média / Alta] - [brief justification]

## Referências
- Código existente: `path/to/reference.ts:LINE`
- Padrão similar: [if applicable]
EOF
)" \
  --label "Triage" --label "feedback" --label "Claude"
```

**Title format:** `[Área] Descrição concisa da feature`
- `[Disputa] Adicionar botão para pausar lance automático`
- `[Dashboard] Filtro por status na lista de licitações`
- `[Notificações] Alerta quando valor mínimo é atingido`

**Labels (ALWAYS include all three):**
- `feedback` - **MANDATORY** on every feature request issue (identifies user-originated suggestions)
- `Triage` - Needs complexity and priority review
- `Claude` - Issue investigated by Claude
- Add `ai-task` additionally if the issue includes a clear technical plan ready for execution

## Issue Quality Checklist

Before creating, verify:

- [ ] **GitHub searched** for duplicates and related issues (Phase 0.5)
- [ ] **Full codebase explored** via Task/Explore agent (Phase 1)
- [ ] Clear title with area prefix
- [ ] User context (plan, tenure - helps prioritization)
- [ ] The actual user request in their words
- [ ] Current behavior with file references
- [ ] Desired behavior clearly described
- [ ] Technical analysis with specific file paths and line numbers
- [ ] Concrete implementation steps (not vague "update the code")
- [ ] Complexity estimate
- [ ] Data model changes identified (if any)
- [ ] Labels include `feedback`, `Triage`, and `Claude`

## Red Flags - STOP and Investigate More

If your issue has:
- No file paths or line numbers
- "Somewhere in the codebase"
- No current behavior description
- Vague implementation steps like "add the feature"
- No complexity estimate

**STOP. Return to Phase 1.**

## Template for Licitei BOT Messages

When the input is a Licitei BOT customer feedback message:

1. Parse the structured fields (area, user info, suggestion)
2. Translate the user's language into a clear technical request
3. **Search GitHub** for duplicate/related issues (`gh issue list --search`)
4. **Launch Task/Explore agent** to search the entire codebase for the affected area
5. Present findings to the user before creating the issue
6. Ask if any additional context or priority should be added
7. Create the issue with labels `feedback`, `Triage`, `Claude` and all technical context

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Creating issue without codebase search | Always run Phase 1 with Task/Explore agent for full codebase search |
| Searching only obvious directories | Use Explore agent to search codebase-wide with multiple keyword variations |
| Missing file paths | Include exact locations for every claim |
| Vague implementation steps | Be specific: file, line, change |
| Forgetting user context | Include plan/tenure for prioritization |
| Not searching GitHub first | Always run `gh issue list --search` in Phase 0.5 before investigating |
| Missing `feedback` label | **ALWAYS** include `feedback`, `Triage`, and `Claude` labels |
| Writing in English when team uses Portuguese | Match the team's language conventions |
| Skipping complexity estimate | Always include Baixa/Média/Alta |

## Example Output

After running this skill, you should have:

1. **Context:** Clear understanding of what the user wants and why
2. **Investigation:** Current codebase state documented with file references
3. **Analysis:** Technical approach with specific changes needed
4. **Issue:** GitHub issue number with full details
5. **Actionable:** A developer can start implementing from the issue alone
