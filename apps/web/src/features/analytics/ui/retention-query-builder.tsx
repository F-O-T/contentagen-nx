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

interface RetentionQueryBuilderProps {
   config: RetentionConfig;
   onUpdate: (updates: Partial<RetentionConfig>) => void;
}

const PERIODS = [
   { value: "day", label: "Day" },
   { value: "week", label: "Week" },
   { value: "month", label: "Month" },
] as const;

const DATE_RANGE_PRESETS = [
   { value: "30d", label: "Last 30 days" },
   { value: "90d", label: "Last 90 days" },
   { value: "180d", label: "Last 180 days" },
   { value: "12m", label: "Last 12 months" },
   { value: "this_quarter", label: "This quarter" },
   { value: "this_year", label: "This year" },
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
               Start event
            </Label>
            <Input
               onChange={(e) =>
                  onUpdate({
                     startEvent: {
                        ...config.startEvent,
                        event: e.target.value,
                     },
                  })
               }
               placeholder="Event that starts a cohort (e.g., content.page.view)"
               value={config.startEvent.event}
            />
            <p className="text-xs text-muted-foreground">
               Users who perform this event start a new cohort
            </p>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Return event
            </Label>
            <Input
               onChange={(e) =>
                  onUpdate({
                     returnEvent: {
                        ...config.returnEvent,
                        event: e.target.value,
                     },
                  })
               }
               placeholder="Event that counts as return (e.g., content.page.view)"
               value={config.returnEvent.event}
            />
            <p className="text-xs text-muted-foreground">
               Users who perform this event are counted as retained
            </p>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Period
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
               Total periods
            </Label>
            <Input
               max={52}
               min={1}
               onChange={(e) =>
                  onUpdate({
                     totalPeriods: Number.parseInt(e.target.value) || 8,
                  })
               }
               type="number"
               value={config.totalPeriods}
            />
            <p className="text-xs text-muted-foreground">
               Number of periods to track (1-52)
            </p>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Date range
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
               Compare to previous period
            </Label>
            <Switch
               checked={config.compare}
               onCheckedChange={(checked) => onUpdate({ compare: checked })}
            />
         </div>
      </div>
   );
}
