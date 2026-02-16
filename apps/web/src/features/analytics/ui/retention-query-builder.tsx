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

export function RetentionQueryBuilder({
   config,
   onUpdate,
}: RetentionQueryBuilderProps) {
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
      </div>
   );
}
