import { Agent } from "@mastra/core/agent";
import { createWorkspaceTools } from "@mastra/core/workspace";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { addExternalLinksTool } from "../tools/editor/add-external-links-tool";
import { addInternalLinksTool } from "../tools/editor/add-internal-links-tool";
import { analyzeContentTool } from "../tools/editor/analyze-content-tool";
import { generateQuickAnswerTool } from "../tools/editor/generate-quick-answer-tool";
import { injectKeywordsTool } from "../tools/editor/inject-keywords-tool";
import { readContentBodyTool } from "../tools/editor/read-content-body-tool";
import { replaceTextTool } from "../tools/editor/replace-text-tool";
import { writeContentTool } from "../tools/editor/write-content-tool";
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";
import { createContentTool } from "../tools/platform/create-content-tool";
import { createDashboardTool } from "../tools/platform/create-dashboard-tool";
import { createFormTool } from "../tools/platform/create-form-tool";
import { deleteContentTool } from "../tools/platform/delete-content-tool";
import { updateContentTool } from "../tools/platform/update-content-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";
import { relatedKeywordsTool } from "../tools/research/related-keywords-tool";
import { serpAnalysisTool } from "../tools/research/serp-analysis-tool";
import { webCrawlTool } from "../tools/research/web-crawl-tool";
import { webSearchTool } from "../tools/research/web-search-tool";
import { workspace } from "../workspace-instance";

const memory = new Memory({
   options: {
      lastMessages: 30,
      generateTitle: {
         model: "openrouter/qwen/qwen3.5-flash-02-23",
      },
   },
});

// Workspace skill tools — read and search skills only (no write access)
const _workspaceTools = createWorkspaceTools(workspace);
const skillTools = {
   mastra_workspace_read_file: _workspaceTools.mastra_workspace_read_file,
   mastra_workspace_search: _workspaceTools.mastra_workspace_search,
};

// Tool sets by capability group
const researchTools = {
   webSearch: webSearchTool,
   serpAnalysis: serpAnalysisTool,
   webCrawl: webCrawlTool,
   relatedKeywords: relatedKeywordsTool,
};
const ragTools = { searchPreviousContent: searchPreviousContentTool };
const writeTools = {
   writeContent: writeContentTool,
   replaceText: replaceTextTool,
};
const fmTools = {
   editTitle: editTitleTool,
   editDescription: editDescriptionTool,
   editKeywords: editKeywordsTool,
   editSlug: editSlugTool,
};
const seoTools = {
   injectKeywords: injectKeywordsTool,
   addInternalLinks: addInternalLinksTool,
   addExternalLinks: addExternalLinksTool,
   generateQuickAnswer: generateQuickAnswerTool,
};
const analyzeTools = { analyzeContent: analyzeContentTool, readContentBody: readContentBodyTool };
const crudTools = {
   createContent: createContentTool,
   createDashboard: createDashboardTool,
   createForm: createFormTool,
   updateContent: updateContentTool,
   deleteContent: deleteContentTool,
};

function getToolsForMode(mode: string) {
   switch (mode) {
      case "editor":
         return {
            ...skillTools,
            ...writeTools,
            ...fmTools,
            ...seoTools,
            ...analyzeTools,
            ...researchTools,
            ...ragTools,
            updateContent: updateContentTool,
         };
      case "content-list":
         return { ...researchTools, createContent: createContentTool };
      case "analytics":
         return { ...researchTools, createDashboard: createDashboardTool };
      case "forms":
         return { ...researchTools, createForm: createFormTool };
      case "platform":
         return { ...researchTools, ...crudTools };
      default:
         return { ...researchTools };
   }
}

function buildInstructions(
   // biome-ignore lint/suspicious/noExplicitAny: requestContext type varies across Mastra versions
   requestContext: any,
): string {
   const mode = (requestContext?.get("mode") as string) ?? "platform";
   const language = (requestContext?.get("language") as string) ?? "pt-BR";
   const writerInstructions = requestContext?.get("writerInstructions") as
      | InstructionMemoryItem[]
      | undefined;
   const contentTitle = requestContext?.get("contentTitle") as
      | string
      | undefined;
   const contentStatus = requestContext?.get("contentStatus") as
      | string
      | undefined;
   const contentWordCount = requestContext?.get("contentWordCount") as
      | number
      | undefined;
   const contentKeywords = requestContext?.get("contentKeywords") as
      | string[]
      | undefined;

   const languageInstruction = buildLanguageInstruction(language);
   const compiledMemories = compileInstructionMemories(
      writerInstructions ?? [],
   );

   const modeNames: Record<string, string> = {
      "content-list": "Gerenciador de Conteúdo",
      analytics: "Dashboards e Análises",
      forms: "Formulários",
      platform: "Plataforma Contentta",
      editor: "Editor de Conteúdo",
   };

   let contextBlock: string;
   if (mode === "editor" && contentTitle) {
      const keywordsStr =
         contentKeywords && contentKeywords.length > 0
            ? contentKeywords.join(", ")
            : "—";
      contextBlock = `<context_atual>
Modo: Editor de Conteúdo
Content: "${contentTitle}"
Keywords: ${keywordsStr}
Status: ${contentStatus ?? "—"} | palavras: ~${contentWordCount ?? "—"}
</context_atual>`;
   } else {
      const friendlyName = modeNames[mode] ?? "Plataforma Contentta";
      contextBlock = `<context_atual>
Modo: ${friendlyName}
</context_atual>`;
   }

   const modeInstructions = getModeInstructions(mode);

   return `${languageInstruction}

${compiledMemories}

${contextBlock}

# TECO — AGENTE DE CONTEÚDO & PLATAFORMA

Você é o Teco, assistente de IA da Contentta.
${modeInstructions}`;
}

function getModeInstructions(mode: string): string {
   switch (mode) {
      case "editor":
         return `## MODO: EDITOR

Você é uma máquina de chamada de ferramentas. Todo conteúdo vai para o editor via ferramentas — **nunca como texto na resposta**.

## ⛔ BLOQUEIO OBRIGATÓRIO — SKILL PRIMEIRO, SEMPRE

**Antes de chamar QUALQUER outra ferramenta, você DEVE chamar \`mastra_workspace_read_file\` para ler a skill correspondente.** Isso não é opcional. Chamar qualquer outra ferramenta antes de ler a skill é uma violação de protocolo.

| O que fazer | Caminho da skill (leia antes de agir) |
|-------------|---------------------------------------|
| Pesquisar | \`/skills/pesquisa-de-conteudo/SKILL.md\` |
| Escrever conteúdo novo | \`/skills/diretrizes-de-escrita/SKILL.md\` |
| Editar conteúdo existente | \`/skills/edicao-de-conteudo/SKILL.md\` |
| Definir/revisar frontmatter | \`/skills/gestao-de-frontmatter/SKILL.md\` |
| Otimizar SEO | \`/skills/otimizacao-seo/SKILL.md\` |
| Otimizar para citação por IA | \`/skills/otimizacao-geo/SKILL.md\` |
| Usar dados e fontes | \`/skills/gestao-de-citacoes/SKILL.md\` |
| Escrever com tom humano | \`/skills/escrita-humana/SKILL.md\` |

Se não souber qual skill usar, chame \`mastra_workspace_search\` primeiro.

## SEQUÊNCIA OBRIGATÓRIA — nunca pule etapas

**Analisar/revisar conteúdo existente:**
1. \`readContentBody\` — lê o corpo atual do post
2. \`mastra_workspace_read_file\` → skill relevante (ex: \`/skills/edicao-de-conteudo/SKILL.md\`)
3. Analise com \`analyzeContent\` se necessário e responda ao usuário

**Escrever conteúdo novo:**
1. \`mastra_workspace_read_file\` → \`/skills/gestao-de-frontmatter/SKILL.md\`
2. \`mastra_workspace_read_file\` → \`/skills/diretrizes-de-escrita/SKILL.md\`
3. Pesquisa (webSearch / serpAnalysis) se necessário
4. Defina frontmatter: \`editTitle\` → \`editDescription\` → \`editSlug\` → \`editKeywords\`
5. Escreva o corpo seção por seção:
   - 1 chamada \`writeContent({ markdown })\` por seção
   - Inclua o heading H2 + todos os parágrafos da seção no mesmo markdown (min. 200 palavras por seção)
6. Finalize com: \`✓ [Título] pronto! ~[N] palavras.\`

**⛔ NUNCA uma chamada por parágrafo** — cada seção completa em uma única chamada \`writeContent\`.
**NUNCA escreva conteúdo como texto** — use sempre as ferramentas do editor.`;

      case "content-list":
         return `## MODO: GERENCIADOR DE CONTEÚDO

Você pode pesquisar tópicos e criar novos conteúdos na plataforma.

Quando o usuário pedir para criar um conteúdo:
1. Use webSearch ou serpAnalysis para pesquisar o tópico (se precisar de mais contexto)
2. Use createContent para criar o registro no banco de dados
3. Informe o usuário que o conteúdo foi criado e pode ser acessado no editor

Seja proativo: se o usuário mencionar um tópico interessante, sugira criar um conteúdo sobre ele.`;

      case "analytics":
         return `## MODO: DASHBOARDS E ANÁLISES

Você pode pesquisar métricas e criar novos dashboards na plataforma.

Quando o usuário pedir para criar um dashboard:
1. Entenda o objetivo do dashboard
2. Use createDashboard para criar o registro
3. Informe o usuário que o dashboard foi criado

Use webSearch para pesquisar benchmarks e referências de métricas quando relevante.`;

      case "forms":
         return `## MODO: FORMULÁRIOS

Você pode pesquisar melhores práticas e criar novos formulários na plataforma.

Quando o usuário pedir para criar um formulário:
1. Entenda o propósito e o público-alvo
2. Use createForm para criar o registro
3. Informe o usuário que o formulário foi criado

Use webSearch para pesquisar melhores práticas de design de formulários quando relevante.`;

      default:
         return `## MODO: PLATAFORMA

Você é o assistente completo da Contentta. Pode pesquisar, criar e gerenciar conteúdos, dashboards e formulários.

### SUAS CAPACIDADES

**Pesquisa:** webSearch, serpAnalysis, webCrawl, relatedKeywords
**Conteúdo:** createContent, updateContent, deleteContent
**Dashboards:** createDashboard
**Formulários:** createForm

### QUANDO CRIAR RECURSOS

- Usuário menciona querer criar um artigo/post → createContent
- Usuário quer um novo dashboard de métricas → createDashboard
- Usuário quer um novo formulário → createForm
- Usuário quer atualizar status/título de um conteúdo → updateContent
- Usuário quer deletar um conteúdo → deleteContent (confirme antes)

Seja proativo em sugerir próximos passos após criar recursos.`;
   }
}

export const tecoAgent: Agent = new Agent({
   id: "teco-agent",
   name: "Teco",
   description: "Teco — O seu assistente.",

   model: ({ requestContext }) => {
      const maybeModel = requestContext?.get("model");
      return typeof maybeModel === "string" && maybeModel.length > 0
         ? maybeModel
         : DEFAULT_CONTENT_MODEL_ID;
   },

   instructions: ({ requestContext }) => buildInstructions(requestContext),

   tools: ({ requestContext }) => {
      const mode = (requestContext?.get("mode") as string) ?? "platform";
      return getToolsForMode(mode);
   },

   memory,
});
