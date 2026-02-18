# Writer Agent Sub-Agent Output Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the orchestrator + writer sub-agent so it produces a full, well-structured article in the editor instead of dumping the agent's interleaved thinking text.

**Architecture:** The writer-agent currently calls editor tools (insertText, insertHeading, etc.) which are server-side pass-throughs. When running as a Mastra sub-agent under the orchestrator, those tool calls are trapped and never surface in the stream — only `result.text` (the agent's thinking) reaches the client. Fix: (1) remove content tools from writer-agent so it generates the full article as its text response with YAML frontmatter; (2) fix the streaming bridge to parse that response and properly set editor content + frontmatter.

**Tech Stack:** Mastra agents, Lexical editor, `setEditorFromMarkdown`, `$convertFromMarkdownString`, YAML frontmatter regex parsing

---

### Task 1: Update writer-agent to generate markdown output instead of calling tools

**Files:**
- Modify: `packages/agents/src/mastra/agents/writer-agent.ts`

**Context:**
- The `writerAgent` is ONLY used as a sub-agent through the orchestrator (it's NOT in `packages/agents/src/mastra/index.ts` directly)
- When it runs as a sub-agent, its tool calls (insertText, insertHeading, editTitle, etc.) are trapped inside Mastra and never surface in the orchestrator's fullStream
- Only `result.text` = the agent's final text response reaches the client
- Editor tools are already server-side pass-throughs (they just return the markdown string, see `packages/agents/src/mastra/tools/editor/insert-text-tool.ts`)

**Step 1: Remove editor and frontmatter tools from writer-agent**

In `packages/agents/src/mastra/agents/writer-agent.ts`, remove these imports (lines 22-43) and the corresponding entries in `tools` (lines 114-137):

Remove these import groups:
- All editor tool imports: `addExternalLinksTool`, `addInternalLinksTool`, `deleteTextTool`, `formatTextTool`, `generateQuickAnswerTool`, `improveReadabilityTool`, `injectKeywordsTool`, `insertCodeBlockTool`, `insertHeadingTool`, `insertImageTool`, `insertListTool`, `insertTableTool`, `insertTextTool`, `optimizeMetaTool`, `optimizeTitleTool`, `replaceTextTool`, `suggestImagesTool`
- All frontmatter tool imports: `editDescriptionTool`, `editKeywordsTool`, `editSlugTool`, `editTitleTool`

Remove these keys from the `tools` object:
- `insertText`, `replaceText`, `deleteText`, `formatText`, `insertHeading`, `insertList`, `insertCodeBlock`, `insertTable`, `insertImage`, `injectKeywords`, `addInternalLinks`, `improveReadability`, `optimizeTitle`, `optimizeMeta`, `generateQuickAnswer`, `suggestImages`, `addExternalLinks`
- `editTitle`, `editDescription`, `editSlug`, `editKeywords`

Keep all analysis tools and RAG/memory tools as-is.

**Step 2: Change writer-agent instructions**

Replace the `getWriterAgentInstructions` function body with:

```typescript
const getWriterAgentInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(
      writerInstructions ?? [],
   );
   const languageInstruction = buildLanguageInstruction(language);

   return `
You are an expert blog post writer. You generate complete, high-quality articles as a single markdown document.

${languageInstruction}

${compiledMemories}

## OUTPUT FORMAT

ALWAYS start your response with YAML frontmatter, followed by the full article body:

\`\`\`
---
title: "Article Title Here"
description: "1-2 sentence meta description"
slug: "article-title-here"
keywords: ["keyword1", "keyword2", "keyword3", "keyword4"]
---

# Article Title Here

Full article content here...
\`\`\`

## RULES

1. The frontmatter MUST be the very first thing in your response — no text before it
2. Use exactly this YAML format: \`title:\`, \`description:\`, \`slug:\`, \`keywords:\`
3. title and description values MUST be wrapped in double quotes
4. keywords MUST be a JSON array of strings: \`["kw1", "kw2"]\`
5. slug MUST be lowercase, hyphenated, no spaces or special chars
6. After the closing \`---\`, write the full article in markdown
7. DO NOT call any tools — your entire response IS the content
8. Generate a complete, high-quality article. Not a stub. Not a summary.

## ARTICLE QUALITY STANDARDS

- Comprehensive coverage of the topic
- Clear headings hierarchy (h2 for main sections, h3 for subsections)
- Use lists, tables, code blocks where appropriate
- At least 800 words for a standard article
- Human-sounding writing, not AI-sounding
- Include a strong introduction and conclusion
- Specific examples, data points, or case studies where relevant
`;
};
```

**Step 3: Verify the file compiles**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "writer-agent|agents/src"
```

Expected: No errors in writer-agent.ts

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/agents/writer-agent.ts
git commit -m "feat(agents): writer-agent generates full markdown instead of calling trapped tools"
```

---

### Task 2: Fix streaming bridge to parse writer-agent output

**Files:**
- Modify: `apps/web/src/layout/editor/hooks/use-streaming-tool-bridge.ts`

**Context:**
- `setEditorFromMarkdown` is exported from `apps/web/src/features/editor/index.ts` (line 288)
- The bridge currently handles `isAgentTool(toolName)` at line 184 by reading `result.text` and writing `$createTextNode(text)` — this is the broken code
- We need to:
  1. Parse YAML frontmatter from `result.text` using a simple regex
  2. Call `onFrontmatterUpdate` with title, description, slug, keywords
  3. Call `setEditorFromMarkdown(editor, body)` with the extracted body
  4. Only do this for `agent-writer` — other agent tools (planner, researcher, etc.) only show in chat

**Step 1: Add setEditorFromMarkdown import**

At the top of `apps/web/src/layout/editor/hooks/use-streaming-tool-bridge.ts`, add to the existing editor import:

```typescript
import {
   isEditorTool,
   isFrontmatterTool,
   isAgentTool,
} from "@/features/content/lib/assistant-runtime-adapter";
import { executeEditorTool, setEditorFromMarkdown } from "@/features/editor";
```

(Just add `setEditorFromMarkdown` to the existing `executeEditorTool` import on line 18.)

**Step 2: Add parseWriterResponse helper function**

Add this function after the `flashHighlight` callback (around line 103), before `executeFrontmatter`:

```typescript
/**
 * Parse writer-agent YAML frontmatter response into structured data.
 * Format: ---\ntitle: "..."\ndescription: "..."\nslug: "..."\nkeywords: [...]\n---\n\n# Body...
 */
function parseWriterResponse(text: string): {
   title?: string;
   description?: string;
   slug?: string;
   keywords?: string[];
   body: string;
} {
   const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
   if (!match) return { body: text };

   const yaml = match[1];
   const body = match[2].trim();

   const titleMatch = yaml.match(/^title:\s*["']?(.+?)["']?\s*$/m);
   const descMatch = yaml.match(/^description:\s*["']?(.+?)["']?\s*$/m);
   const slugMatch = yaml.match(/^slug:\s*["']?(.+?)["']?\s*$/m);
   const kwMatch = yaml.match(/^keywords:\s*\[([^\]]*)\]/m);

   const keywords = kwMatch
      ? kwMatch[1]
           .split(",")
           .map((k) => k.trim().replace(/^["']|["']$/g, ""))
           .filter(Boolean)
      : undefined;

   return {
      title: titleMatch?.[1]?.trim(),
      description: descMatch?.[1]?.trim(),
      slug: slugMatch?.[1]?.trim(),
      keywords,
      body,
   };
}
```

Note: this is a module-level function, NOT a hook — place it outside the `useStreamingToolBridge` function entirely.

**Step 3: Replace the agent tool handler block**

Find the current agent tool handler block (lines 184–202):

```typescript
} else if (isAgentTool(toolName) && editor) {
   const resultRecord = result as Record<string, unknown>;
   const text = typeof resultRecord?.text === "string" ? resultRecord.text : null;
   if (text) {
      // Write the sub-agent's text result to the editor
      editor.update(() => {
         const root = $getRoot();
         // Add a paragraph separator if editor has content
         const existingChildren = root.getChildren();
         if (existingChildren.length > 0) {
            root.append($createParagraphNode());
         }
         // Insert content as a new paragraph
         const paragraph = $createParagraphNode();
         paragraph.append($createTextNode(text));
         root.append(paragraph);
      });
      flashHighlight();
   }
}
```

Replace with:

```typescript
} else if (toolName === "agent-writer" && editor) {
   const resultRecord = result as Record<string, unknown>;
   const text = typeof resultRecord?.text === "string" ? resultRecord.text : null;
   if (text) {
      const parsed = parseWriterResponse(text);

      // Apply frontmatter updates if metadata was extracted
      if (onFrontmatterUpdate) {
         const updates: {
            title?: string;
            description?: string;
            slug?: string;
            keywords?: string[];
         } = {};
         if (parsed.title) updates.title = parsed.title;
         if (parsed.description) updates.description = parsed.description;
         if (parsed.slug) updates.slug = parsed.slug;
         if (parsed.keywords) updates.keywords = parsed.keywords;
         if (Object.keys(updates).length > 0) onFrontmatterUpdate(updates);
      }

      // Set full markdown body in editor (replaces any existing content)
      setEditorFromMarkdown(editor, parsed.body);
      flashHighlight();
   }
}
```

**Step 4: Remove unused imports**

After the change, `$createParagraphNode`, `$createTextNode`, and `$getRoot` may still be used by `animateTextInsertion`. Check and only remove if truly unused.

`$isElementNode` is used in `animateTextInsertion`. Check `$createParagraphNode`, `$createTextNode`, `$getRoot` — they ARE still used in `animateTextInsertion`. Keep them all.

**Step 5: Verify typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "use-streaming-tool-bridge|tool-bridge"
```

Expected: No errors.

**Step 6: Commit**

```bash
git add apps/web/src/layout/editor/hooks/use-streaming-tool-bridge.ts
git commit -m "fix(editor): parse writer-agent YAML response and set editor markdown properly"
```

---

### Task 3: Smoke test the fix

**Step 1: Start the dev server**

```bash
bun dev
```

**Step 2: Open editor and test**

1. Open any content in the editor
2. In the AI Chat sidebar, type: "Escreva um artigo completo sobre licitação pública no Brasil"
3. Wait for the orchestrator to delegate to writer-agent
4. Expected results:
   - Editor body: Full article with proper headings, paragraphs, lists — NOT thinking text
   - Frontmatter `titulo`: Article title set
   - Frontmatter `descricao`: Meta description set
   - Frontmatter `slug`: URL slug set
   - Frontmatter `palavras_chave`: Keywords populated
   - Word count: 800+ words

**Step 3: Verify chat sidebar**

The chat sidebar should show:
- Orchestrator announcement: "Vou escrever um artigo sobre..."
- Agent delegation tool card for `agent-writer`
- Orchestrator summary after completion

**Step 4: Test another agent (non-writer)**

Type: "Analise o SEO do conteúdo"
- Expected: SEO analysis appears in chat, editor is NOT modified

---

### Task 4: (Optional) Handle edge cases

If the writer-agent doesn't always include YAML frontmatter (fallback case where `parseWriterResponse` returns `{ body: text }`):
- The full text (including any frontmatter text) gets set as editor content — acceptable fallback
- Frontmatter fields won't be auto-populated — user can fill manually
- This is acceptable since the main article content is correct

No code change needed for this — the fallback in `parseWriterResponse` already handles it by returning `{ body: text }`.
