import type { TrendsConfig } from "@packages/analytics/types";
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
import { Switch } from "@packages/ui/components/switch";
import { Plus, X } from "lucide-react";
import { EventCombobox } from "./event-combobox";

interface TrendsQueryBuilderProps {
   config: TrendsConfig;
   onUpdate: (updates: Partial<TrendsConfig>) => void;
}

const DATE_RANGE_PRESETS = [
   { value: "7d", label: "Últimos 7 dias" },
   { value: "14d", label: "Últimos 14 dias" },
   { value: "30d", label: "Últimos 30 dias" },
   { value: "90d", label: "Últimos 90 dias" },
   { value: "180d", label: "Últimos 180 dias" },
   { value: "12m", label: "Últimos 12 meses" },
   { value: "this_month", label: "Este mês" },
   { value: "last_month", label: "Mês passado" },
   { value: "this_quarter", label: "Este trimestre" },
   { value: "this_year", label: "Este ano" },
] as const;

const CHART_TYPES = [
   { value: "line", label: "Linha" },
   { value: "bar", label: "Barras" },
   { value: "area", label: "Área" },
   { value: "number", label: "Número" },
] as const;

const MATH_OPERATIONS = [
   { value: "count", label: "Contagem" },
   { value: "sum", label: "Soma" },
   { value: "avg", label: "Média" },
   { value: "min", label: "Mínimo" },
   { value: "max", label: "Máximo" },
   { value: "unique_users", label: "Usuários únicos" },
] as const;

const INTERVALS = [
   { value: "hour", label: "Hora" },
   { value: "day", label: "Dia" },
   { value: "week", label: "Semana" },
   { value: "month", label: "Mês" },
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

   const dateRangeValue =
      config.dateRange.type === "relative" ? config.dateRange.value : "30d";

   return (
      <div className="space-y-6">
         <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Séries
            </Label>
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

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Tipo de gráfico
            </Label>
            <Select
               onValueChange={(value) =>
                  onUpdate({ chartType: value as TrendsConfig["chartType"] })
               }
               value={config.chartType}
            >
               <SelectTrigger>
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {CHART_TYPES.map((ct) => (
                     <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Período
            </Label>
            <Select
               onValueChange={(value) =>
                  onUpdate({
                     dateRange: {
                        type: "relative",
                        value: value as (typeof DATE_RANGE_PRESETS)[number]["value"],
                     },
                  })
               }
               value={dateRangeValue}
            >
               <SelectTrigger>
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {DATE_RANGE_PRESETS.map((dr) => (
                     <SelectItem key={dr.value} value={dr.value}>
                        {dr.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Intervalo
            </Label>
            <Select
               onValueChange={(value) =>
                  onUpdate({ interval: value as TrendsConfig["interval"] })
               }
               value={config.interval}
            >
               <SelectTrigger>
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {INTERVALS.map((iv) => (
                     <SelectItem key={iv.value} value={iv.value}>
                        {iv.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

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
               Referencie séries por letra (A, B, C...). Deixe vazio para não
               usar fórmula.
            </p>
         </div>

         <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Comparar com período anterior
            </Label>
            <Switch
               checked={config.compare}
               onCheckedChange={(checked) => onUpdate({ compare: checked })}
            />
         </div>
      </div>
   );
}
