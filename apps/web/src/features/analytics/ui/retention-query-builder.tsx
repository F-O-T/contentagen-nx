import type { RetentionConfig } from "@packages/analytics/types";
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
import { EventCombobox } from "./event-combobox";

interface RetentionQueryBuilderProps {
   config: RetentionConfig;
   onUpdate: (updates: Partial<RetentionConfig>) => void;
}

const PERIODS = [
   { value: "day", label: "Dia" },
   { value: "week", label: "Semana" },
   { value: "month", label: "Mês" },
] as const;

const DATE_RANGE_PRESETS = [
   { value: "30d", label: "Últimos 30 dias" },
   { value: "90d", label: "Últimos 90 dias" },
   { value: "180d", label: "Últimos 180 dias" },
   { value: "12m", label: "Últimos 12 meses" },
   { value: "this_quarter", label: "Este trimestre" },
   { value: "this_year", label: "Este ano" },
] as const;

export function RetentionQueryBuilder({
   config,
   onUpdate,
}: RetentionQueryBuilderProps) {
   const dateRangeValue =
      config.dateRange.type === "relative" ? config.dateRange.value : "90d";

   return (
      <div className="space-y-6">
         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Evento de início
            </Label>
            <EventCombobox
               onValueChange={(value) =>
                  onUpdate({
                     startEvent: {
                        ...config.startEvent,
                        event: value,
                     },
                  })
               }
               placeholder="Selecione o evento de início..."
               value={config.startEvent.event}
            />
            <p className="text-xs text-muted-foreground">
               Usuários que realizam este evento iniciam uma nova coorte
            </p>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Evento de retorno
            </Label>
            <EventCombobox
               onValueChange={(value) =>
                  onUpdate({
                     returnEvent: {
                        ...config.returnEvent,
                        event: value,
                     },
                  })
               }
               placeholder="Selecione o evento de retorno..."
               value={config.returnEvent.event}
            />
            <p className="text-xs text-muted-foreground">
               Usuários que realizam este evento são contados como retidos
            </p>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Período
            </Label>
            <Select
               onValueChange={(value) =>
                  onUpdate({ period: value as RetentionConfig["period"] })
               }
               value={config.period}
            >
               <SelectTrigger>
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {PERIODS.map((p) => (
                     <SelectItem key={p.value} value={p.value}>
                        {p.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Total de períodos
            </Label>
            <Input
               max={52}
               min={1}
               onChange={(e) =>
                  onUpdate({
                     totalPeriods: Number.parseInt(e.target.value, 10) || 8,
                  })
               }
               type="number"
               value={config.totalPeriods}
            />
            <p className="text-xs text-muted-foreground">
               Número de períodos a rastrear (1-52)
            </p>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Período de análise
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
