/**
 * Agent Delegation Card
 *
 * Visualizes orchestrator → sub-agent delegation calls.
 * Shows which specialist was called, the task given, and the result.
 */

import { Bot, Brain, FileText, Search, Star, type LucideIcon } from "lucide-react";
import { ToolCardBase, type ToolStatus } from "./tool-card-base";

export interface AgentDelegationCardProps {
   toolName: string; // "agent-writer", "agent-planner", etc.
   args: Record<string, unknown>;
   result?: unknown;
   status: ToolStatus;
}

// Agent metadata
const AGENT_META: Record<string, { title: string; icon: LucideIcon; description: string }> = {
   "agent-writer": {
      title: "Especialista em Escrita",
      icon: FileText,
      description: "Escrevendo e editando conteúdo",
   },
   "agent-planner": {
      title: "Especialista em Planejamento",
      icon: Brain,
      description: "Planejando estrutura e outline",
   },
   "agent-researcher": {
      title: "Especialista em Pesquisa",
      icon: Search,
      description: "Pesquisando dados e SERPs",
   },
   "agent-seoAuditor": {
      title: "Especialista em SEO",
      icon: Star,
      description: "Analisando e otimizando SEO",
   },
   "agent-reviewer": {
      title: "Especialista em Revisão",
      icon: Bot,
      description: "Revisando qualidade e tom",
   },
};

export function AgentDelegationCard({ toolName, args, result, status }: AgentDelegationCardProps) {
   const meta = AGENT_META[toolName] ?? {
      title: toolName,
      icon: Bot,
      description: "Executando especialista",
   };

   // Extract text result if available
   const resultRecord = result as Record<string, unknown> | undefined;
   const resultText = typeof resultRecord?.text === "string" ? resultRecord.text : null;

   // Extract prompt from args (Mastra passes it as "prompt" or "messages")
   const promptText =
      typeof args.prompt === "string"
         ? args.prompt
         : typeof args.messages === "string"
           ? args.messages
           : null;

   return (
      <ToolCardBase
         icon={meta.icon}
         status={status}
         title={meta.title}
         // Don't pass args/result to base — we render our own
      >
         {/* Description */}
         <p className="text-xs text-muted-foreground">{meta.description}</p>

         {/* Prompt preview */}
         {promptText && (
            <div className="mt-2 p-2 rounded bg-muted/50 text-xs line-clamp-2 italic">
               "{promptText.slice(0, 120)}{promptText.length > 120 ? "…" : ""}"
            </div>
         )}

         {/* Result preview */}
         {resultText && status === "complete" && (
            <div className="mt-2 p-2 rounded bg-green-500/5 border border-green-500/20 text-xs text-muted-foreground line-clamp-3">
               <span className="text-green-600 font-medium text-[10px] uppercase tracking-wide block mb-1">
                  Escrito no editor
               </span>
               {resultText.slice(0, 200)}{resultText.length > 200 ? "…" : ""}
            </div>
         )}
      </ToolCardBase>
   );
}
