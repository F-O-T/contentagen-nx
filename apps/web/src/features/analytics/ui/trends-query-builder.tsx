import type { TrendsConfig } from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { ChevronDown, Plus, X } from "lucide-react";
import { EventCombobox } from "./event-combobox";

interface TrendsQueryBuilderProps {
   config: TrendsConfig;
   onUpdate: (updates: Partial<TrendsConfig>) => void;
}

const MATH_OPERATIONS = [
   { value: "count", label: "Contagem" },
   { value: "sum", label: "Soma" },
   { value: "avg", label: "Média" },
   { value: "min", label: "Mínimo" },
   { value: "max", label: "Máximo" },
   { value: "unique_users", label: "Usuários únicos" },
] as const;

export function TrendsQueryBuilder({
   config,
   onUpdate,
}: TrendsQueryBuilderProps) {
   const addSeries = () => {
      onUpdate({
         series: [
            ...config.series,
            {
               event: "",
               math: "count",
               label: `Série ${String.fromCharCode(65 + config.series.length)}`,
            },
         ],
      });
   };

   const removeSeries = (index: number) => {
      onUpdate({
         series: config.series.filter((_, i) => i !== index),
      });
   };

   const updateSeries = (
      index: number,
      updates: Partial<{
         event: string;
         math: TrendsConfig["series"][number]["math"];
         label: string;
      }>,
   ) => {
      const series = [...config.series];
      series[index] = { ...series[index], ...updates };
      onUpdate({ series });
   };

   return (
      <div className="rounded-lg border bg-card p-4">
         <div className="space-y-3">
            {config.series.map((s, index) => (
               <div
                  className="space-y-2 border rounded-md p-3"
                  key={`series-${index + 1}`}
               >
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-muted-foreground">
                        {String.fromCharCode(65 + index)}
                     </span>
                     {config.series.length > 1 && (
                        <Button
                           className="size-6"
                           onClick={() => removeSeries(index)}
                           size="icon"
                           variant="ghost"
                        >
                           <X className="size-3.5" />
                        </Button>
                     )}
                  </div>
                  <EventCombobox
                     onValueChange={(value) =>
                        updateSeries(index, { event: value })
                     }
                     placeholder="Selecione um evento..."
                     value={s.event}
                  />
                  <Select
                     onValueChange={(value) =>
                        updateSeries(index, {
                           math: value as TrendsConfig["series"][number]["math"],
                        })
                     }
                     value={s.math}
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {MATH_OPERATIONS.map((op) => (
                           <SelectItem key={op.value} value={op.value}>
                              {op.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            ))}
            <Button
               className="w-full"
               onClick={addSeries}
               size="sm"
               variant="outline"
            >
               <Plus className="size-4 mr-1" />
               Adicionar série
            </Button>
         </div>

         <Collapsible className="mt-4">
            <CollapsibleTrigger asChild>
               <Button
                  className="w-full justify-between"
                  size="sm"
                  variant="ghost"
               >
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                     Opções avançadas
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
               </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
               <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                     Fórmula (opcional)
                  </Label>
                  <Input
                     onChange={(e) =>
                        onUpdate({ formula: e.target.value || undefined })
                     }
                     placeholder="Ex: A / B * 100"
                     value={config.formula ?? ""}
                  />
                  <p className="text-xs text-muted-foreground">
                     Referencie séries por letra (A, B, C...). Deixe vazio para
                     não usar fórmula.
                  </p>
               </div>
            </CollapsibleContent>
         </Collapsible>
      </div>
   );
}
