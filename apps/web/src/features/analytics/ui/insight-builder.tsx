import type {
   FunnelsConfig,
   InsightConfig,
   RetentionConfig,
   TrendsConfig,
} from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import { Loader2 } from "lucide-react";
import type { InsightType } from "../hooks/use-insight-config";
import { FunnelsQueryBuilder } from "./funnels-query-builder";
import { InsightPreview } from "./insight-preview";
import { RetentionQueryBuilder } from "./retention-query-builder";
import { TrendsQueryBuilder } from "./trends-query-builder";

// ---------------------------------------------------------------------------
// Tab bar (inline — keeps this file self-contained)
// ---------------------------------------------------------------------------

const TABS: Array<{ id: InsightType; label: string }> = [
   { id: "trends", label: "Tendências" },
   { id: "funnels", label: "Funis" },
   { id: "retention", label: "Retenção" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InsightBuilderProps {
   /** Page heading text */
   heading: string;
   /** Insight name (controlled) */
   name: string;
   onNameChange: (name: string) => void;
   /** Optional description */
   description: string;
   onDescriptionChange: (description: string) => void;
   /** Insight type & config (controlled via useInsightConfig) */
   type: InsightType;
   config: InsightConfig;
   onTypeChange: (type: InsightType) => void;
   onConfigUpdate: (updates: Partial<InsightConfig>) => void;
   /** Save action */
   onSave: () => void;
   isSaving: boolean;
   /** Disable type switching (e.g. when editing an existing insight) */
   disableTypeSwitch?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InsightBuilder({
   heading,
   name,
   onNameChange,
   description,
   onDescriptionChange,
   type,
   config,
   onTypeChange,
   onConfigUpdate,
   onSave,
   isSaving,
   disableTypeSwitch = false,
}: InsightBuilderProps) {
   const canSave = name.trim().length > 0;

   return (
      <main className="flex flex-col gap-4 h-full">
         {/* Header */}
         <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 flex-1 max-w-lg">
               <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
                  {heading}
               </h1>
               <div className="space-y-2">
                  <div>
                     <Label
                        className="text-xs font-semibold uppercase text-muted-foreground tracking-wider"
                        htmlFor="insight-name"
                     >
                        Nome
                     </Label>
                     <Input
                        id="insight-name"
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Ex: Visualizações por conteúdo"
                        value={name}
                     />
                  </div>
                  <div>
                     <Label
                        className="text-xs font-semibold uppercase text-muted-foreground tracking-wider"
                        htmlFor="insight-description"
                     >
                        Descrição (opcional)
                     </Label>
                     <Textarea
                        className="resize-none"
                        id="insight-description"
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Descreva brevemente o que este insight mostra"
                        rows={2}
                        value={description}
                     />
                  </div>
               </div>
            </div>
            <Button
               className="mt-2"
               disabled={!canSave || isSaving}
               onClick={onSave}
               size="sm"
            >
               {isSaving && <Loader2 className="size-4 animate-spin" />}
               {isSaving ? "Salvando..." : "Salvar insight"}
            </Button>
         </div>

         {/* Tab bar */}
         <div className="flex items-center border-b pb-0">
            <div className="flex items-center gap-0">
               {TABS.map((tab) => (
                  <button
                     className={cn(
                        "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        type === tab.id
                           ? "border-primary text-primary"
                           : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                     )}
                     disabled={disableTypeSwitch && tab.id !== type}
                     key={tab.id}
                     onClick={() => onTypeChange(tab.id)}
                     type="button"
                  >
                     {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {/* Builder + Preview */}
         <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 flex-1 min-h-0">
            <div className="overflow-y-auto border rounded-lg p-4 bg-card">
               {type === "trends" && (
                  <TrendsQueryBuilder
                     config={config as TrendsConfig}
                     onUpdate={onConfigUpdate}
                  />
               )}
               {type === "funnels" && (
                  <FunnelsQueryBuilder
                     config={config as FunnelsConfig}
                     onUpdate={onConfigUpdate}
                  />
               )}
               {type === "retention" && (
                  <RetentionQueryBuilder
                     config={config as RetentionConfig}
                     onUpdate={onConfigUpdate}
                  />
               )}
            </div>
            <div className="min-h-[400px]">
               <InsightPreview config={config} />
            </div>
         </div>
      </main>
   );
}
