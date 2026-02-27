/**
 * Minimal tool name → human-readable label map for the generic ToolFallback.
 * The full config (with icons) lives in apps/web for domain-specific components.
 */
export const TOOL_DISPLAY_LABELS: Record<string, string> = {
  // Agent sub-calls
  "agent-research-agent": "Research & Planning Agent",
  "agent-writer-agent": "Writer & Editor Agent",
  "agent-seo-auditor-agent": "SEO Auditor Agent",
  "agent-reviewer-agent": "Content Reviewer Agent",
  "agent-content-agent": "Content Agent",
  // Editor
  insertText: "Inserindo texto",
  replaceText: "Substituindo texto",
  deleteText: "Removendo texto",
  formatText: "Formatando texto",
  insertHeading: "Inserindo título",
  insertList: "Inserindo lista",
  insertCodeBlock: "Inserindo código",
  insertTable: "Inserindo tabela",
  addEditorComment: "Adicionando comentário",
  proposeSuggestion: "Propondo sugestão",
  // Frontmatter
  editTitle: "Definindo título",
  editDescription: "Definindo descrição",
  editKeywords: "Definindo palavras-chave",
  editSlug: "Definindo slug",
  // Research
  webSearch: "Buscando na web",
  serpAnalysis: "Analisando SERP",
  competitorContent: "Analisando concorrentes",
  contentGap: "Identificando lacunas",
  relatedKeywords: "Pesquisando palavras-chave",
  factFinder: "Verificando dados",
  webCrawl: "Analisando página",
  researchCompleteness: "Validando pesquisa",
  searchPreviousContent: "Verificando conteúdo existente",
  graphSearch: "Buscando conhecimento",
  // SEO editor
  optimizeTitle: "Otimizando título",
  optimizeMeta: "Otimizando meta",
  injectKeywords: "Inserindo palavras-chave",
  addInternalLinks: "Adicionando links internos",
  addExternalLinks: "Adicionando links externos",
  improveReadability: "Melhorando legibilidade",
  generateQuickAnswer: "Gerando resposta rápida",
  // Analysis
  seoScore: "Calculando score SEO",
  readability: "Analisando legibilidade",
  keywordDensity: "Analisando densidade",
  contentStructure: "Analisando estrutura",
  badPatterns: "Detectando padrões",
  titleMeta: "Auditando título/meta",
  quickAnswerAnalysis: "Analisando snippet",
  imageSeo: "Auditando imagens",
  linkDensity: "Analisando links",
  duplicateContent: "Verificando duplicatas",
  toneAnalysis: "Analisando tom",
  citation: "Verificando citações",
  originality: "Verificando originalidade",
  // Memory & Utility
  getInstructionMemories: "Carregando preferências",
  dateTool: "Obtendo data atual",
};
