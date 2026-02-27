import {
  BookOpen,
  Bot,
  ChartBar,
  CheckCircle,
  Code,
  FileText,
  Globe,
  Hash,
  Key,
  Link,
  List,
  MessageSquare,
  PenLine,
  Search,
  Sparkles,
  Table,
  Tag,
  Trash2,
  Type,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory =
  | "agent"
  | "editor"
  | "frontmatter"
  | "research"
  | "seo"
  | "analysis"
  | "memory"
  | "utility";

export interface ToolDisplayConfig {
  icon: LucideIcon;
  label: string;
  category: ToolCategory;
}

export const TOOL_DISPLAY_CONFIG: Record<string, ToolDisplayConfig> = {
  // ── Agent sub-calls ──────────────────────────────────────────────
  "agent-research-agent": {
    icon: Search,
    label: "Research & Planning Agent",
    category: "agent",
  },
  "agent-writer-agent": {
    icon: PenLine,
    label: "Writer & Editor Agent",
    category: "agent",
  },
  "agent-seo-auditor-agent": {
    icon: ChartBar,
    label: "SEO Auditor Agent",
    category: "agent",
  },
  "agent-reviewer-agent": {
    icon: CheckCircle,
    label: "Content Reviewer Agent",
    category: "agent",
  },
  "agent-content-agent": {
    icon: Bot,
    label: "Content Agent",
    category: "agent",
  },

  // ── Editor tools ─────────────────────────────────────────────────
  insertText: { icon: PenLine, label: "Inserindo texto", category: "editor" },
  replaceText: { icon: Wand2, label: "Substituindo texto", category: "editor" },
  deleteText: { icon: Trash2, label: "Removendo texto", category: "editor" },
  formatText: { icon: Type, label: "Formatando texto", category: "editor" },
  insertHeading: { icon: Hash, label: "Inserindo título", category: "editor" },
  insertList: { icon: List, label: "Inserindo lista", category: "editor" },
  insertCodeBlock: { icon: Code, label: "Inserindo código", category: "editor" },
  insertTable: { icon: Table, label: "Inserindo tabela", category: "editor" },
  addEditorComment: { icon: MessageSquare, label: "Adicionando comentário", category: "editor" },
  proposeSuggestion: { icon: Sparkles, label: "Propondo sugestão", category: "editor" },

  // ── Frontmatter tools ────────────────────────────────────────────
  editTitle: { icon: Type, label: "Definindo título", category: "frontmatter" },
  editDescription: { icon: FileText, label: "Definindo descrição", category: "frontmatter" },
  editKeywords: { icon: Tag, label: "Definindo palavras-chave", category: "frontmatter" },
  editSlug: { icon: Link, label: "Definindo slug", category: "frontmatter" },

  // ── Research tools ───────────────────────────────────────────────
  webSearch: { icon: Globe, label: "Buscando na web", category: "research" },
  serpAnalysis: { icon: ChartBar, label: "Analisando SERP", category: "research" },
  competitorContent: { icon: BookOpen, label: "Analisando concorrentes", category: "research" },
  contentGap: { icon: Search, label: "Identificando lacunas", category: "research" },
  relatedKeywords: { icon: Key, label: "Pesquisando palavras-chave", category: "research" },
  factFinder: { icon: Search, label: "Verificando dados", category: "research" },
  webCrawl: { icon: Globe, label: "Analisando página", category: "research" },
  researchCompleteness: { icon: CheckCircle, label: "Validando pesquisa", category: "research" },

  // ── SEO editor tools ─────────────────────────────────────────────
  optimizeTitle: { icon: Type, label: "Otimizando título", category: "seo" },
  optimizeMeta: { icon: FileText, label: "Otimizando meta", category: "seo" },
  injectKeywords: { icon: Key, label: "Inserindo palavras-chave", category: "seo" },
  addInternalLinks: { icon: Link, label: "Adicionando links internos", category: "seo" },
  addExternalLinks: { icon: Globe, label: "Adicionando links externos", category: "seo" },
  improveReadability: { icon: BookOpen, label: "Melhorando legibilidade", category: "seo" },
  generateQuickAnswer: { icon: Sparkles, label: "Gerando resposta rápida", category: "seo" },

  // ── Analysis tools ───────────────────────────────────────────────
  seoScore: { icon: ChartBar, label: "Calculando score SEO", category: "analysis" },
  readability: { icon: BookOpen, label: "Analisando legibilidade", category: "analysis" },
  keywordDensity: { icon: Key, label: "Analisando densidade", category: "analysis" },
  contentStructure: { icon: List, label: "Analisando estrutura", category: "analysis" },
  badPatterns: { icon: Search, label: "Detectando padrões", category: "analysis" },
  titleMeta: { icon: Type, label: "Auditando título/meta", category: "analysis" },
  quickAnswerAnalysis: { icon: Sparkles, label: "Analisando snippet", category: "analysis" },
  imageSeo: { icon: Search, label: "Auditando imagens", category: "analysis" },
  linkDensity: { icon: Link, label: "Analisando links", category: "analysis" },
  duplicateContent: { icon: FileText, label: "Verificando duplicatas", category: "analysis" },
  toneAnalysis: { icon: MessageSquare, label: "Analisando tom", category: "analysis" },
  citation: { icon: BookOpen, label: "Verificando citações", category: "analysis" },
  originality: { icon: Sparkles, label: "Verificando originalidade", category: "analysis" },

  // ── Memory & Utility ─────────────────────────────────────────────
  searchPreviousContent: { icon: BookOpen, label: "Verificando conteúdo existente", category: "memory" },
  graphSearch: { icon: Search, label: "Buscando conhecimento", category: "memory" },
  getInstructionMemories: { icon: BookOpen, label: "Carregando preferências", category: "memory" },
  dateTool: { icon: FileText, label: "Obtendo data atual", category: "utility" },
};

export function getToolDisplay(toolName: string): ToolDisplayConfig | null {
  return TOOL_DISPLAY_CONFIG[toolName] ?? null;
}
