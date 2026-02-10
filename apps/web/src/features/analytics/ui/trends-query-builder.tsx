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

interface TrendsQueryBuilderProps {
   config: TrendsConfig;
   onUpdate: (updates: Partial<TrendsConfig>) => void;
}

const DATE_RANGE_PRESETS = [
   { value: "7d", label: "Last 7 days" },
   { value: "14d", label: "Last 14 days" },
   { value: "30d", label: "Last 30 days" },
   { value: "90d", label: "Last 90 days" },
   { value: "180d", label: "Last 180 days" },
   { value: "12m", label: "Last 12 months" },
   { value: "this_month", label: "This month" },
   { value: "last_month", label: "Last month" },
   { value: "this_quarter", label: "This quarter" },
   { value: "this_year", label: "This year" },
] as const;

const CHART_TYPES = [
   { value: "line", label: "Line" },
   { value: "bar", label: "Bar" },
   { value: "area", label: "Area" },
   { value: "number", label: "Number" },
] as const;

const MATH_OPERATIONS = [
   { value: "count", label: "Count" },
   { value: "sum", label: "Sum" },
   { value: "avg", label: "Average" },
   { value: "min", label: "Min" },
   { value: "max", label: "Max" },
   { value: "unique_users", label: "Unique users" },
] as const;

const INTERVALS = [
   { value: "hour", label: "Hour" },
   { value: "day", label: "Day" },
   { value: "week", label: "Week" },
   { value: "month", label: "Month" },
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
               label: `Series ${String.fromCharCode(65 + config.series.length)}`,
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
               Series
            </Label>
            {config.series.map((s, index) => (
               <div
                  className="flex items-center gap-2"
                  key={`series-${index + 1}`}
               >
                  <span className="text-xs font-bold text-muted-foreground w-5">
                     {String.fromCharCode(65 + index)}
                  </span>
                  <Input
                     className="flex-1"
                     onChange={(e) =>
                        updateSeries(index, { event: e.target.value })
                     }
                     placeholder="Event name (e.g., content.page.view)"
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
                     <SelectTrigger className="w-[130px]">
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
                  {config.series.length > 1 && (
                     <Button
                        className="size-8"
                        onClick={() => removeSeries(index)}
                        size="icon"
                        variant="ghost"
                     >
                        <X className="size-4" />
                     </Button>
                  )}
               </div>
            ))}
            <Button
               className="w-full"
               onClick={addSeries}
               size="sm"
               variant="outline"
            >
               <Plus className="size-4 mr-1" />
               Add series
            </Button>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Chart type
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

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Interval
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
               Formula (optional)
            </Label>
            <Input
               onChange={(e) =>
                  onUpdate({ formula: e.target.value || undefined })
               }
               placeholder="e.g., A / B * 100"
               value={config.formula ?? ""}
            />
            <p className="text-xs text-muted-foreground">
               Reference series by letter (A, B, C...). Leave empty for no
               formula.
            </p>
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
