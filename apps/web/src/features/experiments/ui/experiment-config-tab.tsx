import { Badge } from "@packages/ui/components/badge";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import { FileText, FlaskConical, Layers } from "lucide-react";
import type {
   ExperimentConfig,
   ExperimentGoal,
   ExperimentTargetType,
} from "../hooks/use-experiment-config";

interface ExperimentConfigTabProps {
   config: ExperimentConfig;
   onUpdate: (updates: Partial<ExperimentConfig>) => void;
   canEdit: boolean;
}

const TARGET_TYPE_OPTIONS: {
   value: ExperimentTargetType;
   label: string;
   description: string;
   icon: React.ElementType;
}[] = [
   {
      value: "content",
      label: "Conteúdo",
      description: "Compare variantes de artigos e páginas de conteúdo",
      icon: FileText,
   },
   {
      value: "form",
      label: "Formulário",
      description: "Compare variantes de formulários de captura",
      icon: FlaskConical,
   },
   {
      value: "cluster",
      label: "Cluster",
      description: "Compare clusters de conteúdo inteiros",
      icon: Layers,
   },
];

const GOAL_OPTIONS: {
   value: ExperimentGoal;
   label: string;
   description: string;
}[] = [
   {
      value: "conversion",
      label: "Conversão",
      description: "Taxa de conversão geral",
   },
   {
      value: "ctr",
      label: "CTR",
      description: "Taxa de cliques (Click-through rate)",
   },
   {
      value: "time_on_page",
      label: "Tempo na página",
      description: "Tempo médio de permanência",
   },
   {
      value: "form_submit",
      label: "Envio de formulário",
      description: "Taxa de preenchimento de formulário",
   },
];

export function ExperimentConfigTab({
   config,
   onUpdate,
   canEdit,
}: ExperimentConfigTabProps) {
   return (
      <div className="flex flex-col gap-8 max-w-2xl">
         {/* Hypothesis */}
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-hypothesis">
               Hipótese
               <span className="ml-1 text-muted-foreground font-normal">
                  (opcional)
               </span>
            </Label>
            <Textarea
               disabled={!canEdit}
               id="exp-hypothesis"
               onChange={(e) => onUpdate({ hypothesis: e.target.value })}
               placeholder="Descreva o que você espera descobrir com este experimento..."
               rows={3}
               value={config.hypothesis}
            />
         </div>

         {/* Target Type */}
         <div className="flex flex-col gap-3">
            <Label>Tipo de alvo</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               {TARGET_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = config.targetType === opt.value;
                  return (
                     <button
                        className={cn(
                           "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                           isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/40 hover:bg-muted/30",
                           !canEdit && "cursor-not-allowed opacity-60",
                        )}
                        disabled={!canEdit}
                        key={opt.value}
                        onClick={() =>
                           canEdit && onUpdate({ targetType: opt.value })
                        }
                        type="button"
                     >
                        <div className="flex items-center gap-2">
                           <Icon
                              className={cn(
                                 "size-4",
                                 isSelected
                                    ? "text-primary"
                                    : "text-muted-foreground",
                              )}
                           />
                           <span className="text-sm font-medium">
                              {opt.label}
                           </span>
                           {isSelected && (
                              <Badge className="ml-auto" variant="default">
                                 Selecionado
                              </Badge>
                           )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                           {opt.description}
                        </p>
                     </button>
                  );
               })}
            </div>
         </div>

         {/* Goal */}
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-goal">Métrica principal</Label>
            <Select
               disabled={!canEdit}
               onValueChange={(v) => onUpdate({ goal: v as ExperimentGoal })}
               value={config.goal}
            >
               <SelectTrigger className="max-w-sm" id="exp-goal">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {GOAL_OPTIONS.map((opt) => (
                     <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col gap-0.5">
                           <span>{opt.label}</span>
                           <span className="text-xs text-muted-foreground">
                              {opt.description}
                           </span>
                        </div>
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
      </div>
   );
}
