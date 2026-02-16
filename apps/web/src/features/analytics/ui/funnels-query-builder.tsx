import type { FunnelsConfig } from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Plus, X } from "lucide-react";
import { EventCombobox } from "./event-combobox";

interface FunnelsQueryBuilderProps {
   config: FunnelsConfig;
   onUpdate: (updates: Partial<FunnelsConfig>) => void;
}

const WINDOW_UNITS = [
   { value: "minute", label: "Minutos" },
   { value: "hour", label: "Horas" },
   { value: "day", label: "Dias" },
   { value: "week", label: "Semanas" },
] as const;

export function FunnelsQueryBuilder({
   config,
   onUpdate,
}: FunnelsQueryBuilderProps) {
   const addStep = () => {
      onUpdate({
         steps: [
            ...config.steps,
            {
               event: "",
               label: `Etapa ${config.steps.length + 1}`,
               filters: [],
            },
         ],
      });
   };

   const removeStep = (index: number) => {
      if (config.steps.length <= 2) return;
      onUpdate({ steps: config.steps.filter((_, i) => i !== index) });
   };

   const updateStep = (
      index: number,
      updates: Partial<{ event: string; label: string }>,
   ) => {
      const steps = [...config.steps];
      steps[index] = { ...steps[index], ...updates };
      onUpdate({ steps });
   };

   return (
      <div className="space-y-6">
         <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Etapas
            </Label>
            {config.steps.map((step, index) => (
               <div
                  className="space-y-2 border rounded-md p-3"
                  key={`step-${index + 1}`}
               >
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-muted-foreground">
                        Etapa {index + 1}
                     </span>
                     {config.steps.length > 2 && (
                        <Button
                           className="size-6"
                           onClick={() => removeStep(index)}
                           size="icon"
                           variant="ghost"
                        >
                           <X className="size-3.5" />
                        </Button>
                     )}
                  </div>
                  <EventCombobox
                     onValueChange={(value) =>
                        updateStep(index, { event: value })
                     }
                     placeholder="Selecione um evento..."
                     value={step.event}
                  />
                  <Input
                     onChange={(e) =>
                        updateStep(index, { label: e.target.value })
                     }
                     placeholder="Rótulo (opcional)"
                     value={step.label ?? ""}
                  />
               </div>
            ))}
            <Button
               className="w-full"
               onClick={addStep}
               size="sm"
               variant="outline"
            >
               <Plus className="size-4 mr-1" />
               Adicionar etapa
            </Button>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Janela de conversão
            </Label>
            <div className="flex items-center gap-2">
               <Input
                  className="w-[100px]"
                  max={365}
                  min={1}
                  onChange={(e) =>
                     onUpdate({
                        conversionWindow: {
                           ...config.conversionWindow,
                           value: Number.parseInt(e.target.value, 10) || 14,
                        },
                     })
                  }
                  type="number"
                  value={config.conversionWindow.value}
               />
               <Select
                  onValueChange={(value) =>
                     onUpdate({
                        conversionWindow: {
                           ...config.conversionWindow,
                           unit: value as FunnelsConfig["conversionWindow"]["unit"],
                        },
                     })
                  }
                  value={config.conversionWindow.unit}
               >
                  <SelectTrigger className="w-[120px]">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {WINDOW_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                           {u.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>
      </div>
   );
}
