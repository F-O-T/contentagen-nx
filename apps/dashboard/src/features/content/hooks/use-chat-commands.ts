import type { LucideIcon } from "lucide-react";
import {
   BarChart3,
   BookOpen,
   Expand,
   FileCode,
   FileText,
   Link2,
   ListChecks,
   Pencil,
   Search,
   SpellCheck,
   Tags,
   Target,
   TextSelect,
   Trash2,
   Type,
   Wand2,
   Zap,
} from "lucide-react";
import { useMemo } from "react";
import { clearChat, setChatMode, useChatState } from "../context/chat-context";

export interface ChatCommand {
   id: string;
   label: string;
   description: string;
   icon: LucideIcon;
   shortcut?: string;
   category: "mode" | "action" | "context" | "workflow";
}

export interface SlashCommand extends ChatCommand {
   handler: () => void;
}

export interface MentionCommand extends ChatCommand {
   getValue: () => string;
}

export interface CommandContext {
   documentContent: string;
   selectionContext: { text: string } | null;
   contentMetadata: {
      title: string;
      keywords?: string[];
   } | null;
}

interface UseChatCommandsResult {
   slashCommands: SlashCommand[];
   mentionCommands: MentionCommand[];
   filterCommands: <T extends ChatCommand>(commands: T[], query: string) => T[];
}

export function useChatCommands(
   onSendMessage?: (message: string) => void,
): UseChatCommandsResult {
   const { documentContent, selectionContext, contentMetadata } =
      useChatState();

   const slashCommands = useMemo<SlashCommand[]>(
      () => [
         // Mode commands
         {
            id: "plan",
            label: "planejar",
            description: "Alternar para modo planejamento (pesquisa e planejamento)",
            icon: ListChecks,
            category: "mode",
            handler: () => setChatMode("plan"),
         },
         {
            id: "writer",
            label: "escritor",
            description: "Alternar para modo escritor (edição direta)",
            icon: Pencil,
            category: "mode",
            handler: () => setChatMode("writer"),
         },
         // Action commands
         {
            id: "improve",
            label: "melhorar",
            description: "Melhorar a qualidade da escrita",
            icon: Wand2,
            category: "action",
            handler: () => {
               const text = selectionContext?.text || "o conteúdo";
               onSendMessage?.(`Melhore ${text}`);
            },
         },
         {
            id: "expand",
            label: "expandir",
            description: "Expandir e adicionar mais detalhes",
            icon: Expand,
            category: "action",
            handler: () => {
               const text = selectionContext?.text || "o conteúdo";
               onSendMessage?.(`Expanda e adicione mais detalhes a ${text}`);
            },
         },
         {
            id: "summarize",
            label: "resumir",
            description: "Criar um resumo",
            icon: FileText,
            category: "action",
            handler: () => {
               onSendMessage?.("Resuma este conteúdo");
            },
         },
         {
            id: "fix",
            label: "corrigir",
            description: "Corrigir gramática e ortografia",
            icon: SpellCheck,
            category: "action",
            handler: () => {
               const text = selectionContext?.text || "o conteúdo";
               onSendMessage?.(`Corrija gramática e ortografia em ${text}`);
            },
         },
         {
            id: "analyze",
            label: "analisar",
            description: "Executar análise de SEO e legibilidade",
            icon: BarChart3,
            category: "action",
            handler: () => {
               onSendMessage?.(
                  "Analise este conteúdo para pontuação SEO, legibilidade e densidade de palavras-chave. Mostre-me os resultados.",
               );
            },
         },
         {
            id: "optimize",
            label: "otimizar",
            description: "Otimizar SEO com correções de palavras-chave e links",
            icon: Zap,
            category: "action",
            handler: () => {
               onSendMessage?.(
                  "Otimize este conteúdo para SEO: corrija a densidade de palavras-chave, adicione links internos e melhore a meta descrição.",
               );
            },
         },
         {
            id: "clear",
            label: "limpar",
            description: "Limpar a conversa",
            icon: Trash2,
            category: "action",
            handler: () => clearChat(),
         },
      ],
      [selectionContext, onSendMessage],
   );

   const mentionCommands = useMemo<MentionCommand[]>(
      () => [
         // Context references
         {
            id: "document",
            label: "documento",
            description: "Referenciar o documento completo",
            icon: FileCode,
            category: "context",
            getValue: () => {
               if (!documentContent) return "[Sem conteúdo do documento]";
               const preview =
                  documentContent.length > 100
                     ? `${documentContent.slice(0, 100)}...`
                     : documentContent;
               return `[Documento: ${preview}]`;
            },
         },
         {
            id: "selection",
            label: "selecao",
            description: "Referenciar a seleção atual",
            icon: TextSelect,
            category: "context",
            getValue: () => {
               if (!selectionContext?.text) return "[Sem seleção]";
               return `[Seleção: ${selectionContext.text}]`;
            },
         },
         {
            id: "title",
            label: "titulo",
            description: "Referenciar o título do conteúdo",
            icon: Type,
            category: "context",
            getValue: () => {
               if (!contentMetadata?.title) return "[Sem título]";
               return `[Título: ${contentMetadata.title}]`;
            },
         },
         {
            id: "keywords",
            label: "palavras-chave",
            description: "Referenciar as palavras-chave do conteúdo",
            icon: Tags,
            category: "context",
            getValue: () => {
               if (!contentMetadata?.keywords?.length) return "[Sem palavras-chave]";
               return `[Palavras-chave: ${contentMetadata.keywords.join(", ")}]`;
            },
         },
         // Workflow mentions
         {
            id: "seo-analysis",
            label: "analise-seo",
            description: "Executar análise SEO completa no conteúdo",
            icon: Search,
            category: "workflow",
            getValue: () => "@workflow:analise-seo",
         },
         {
            id: "improve-readability",
            label: "melhorar-legibilidade",
            description: "Analisar e melhorar a legibilidade do conteúdo",
            icon: BookOpen,
            category: "workflow",
            getValue: () => "@workflow:melhorar-legibilidade",
         },
         {
            id: "keyword-optimization",
            label: "otimizar-palavras-chave",
            description: "Otimizar densidade e posicionamento de palavras-chave",
            icon: Target,
            category: "workflow",
            getValue: () => "@workflow:otimizar-palavras-chave",
         },
         {
            id: "add-links",
            label: "adicionar-links",
            description: "Encontrar e adicionar links internos relevantes",
            icon: Link2,
            category: "workflow",
            getValue: () => "@workflow:adicionar-links",
         },
      ],
      [documentContent, selectionContext, contentMetadata],
   );

   const filterCommands = useMemo(
      () =>
         <T extends ChatCommand>(commands: T[], query: string): T[] => {
            if (!query) return commands;
            const lowerQuery = query.toLowerCase();
            return commands.filter(
               (cmd) =>
                  cmd.label.toLowerCase().includes(lowerQuery) ||
                  cmd.description.toLowerCase().includes(lowerQuery),
            );
         },
      [],
   );

   return {
      slashCommands,
      mentionCommands,
      filterCommands,
   };
}
