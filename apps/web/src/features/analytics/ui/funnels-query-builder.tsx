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
import { Switch } from "@packages/ui/components/switch";
import { Plus, X } from "lucide-react";

interface FunnelsQueryBuilderProps {
   config: FunnelsConfig;
   onUpdate: (updates: Partial<FunnelsConfig>) => void;
}

const DATE_RANGE_PRESETS = [
   { value: "7d", label: "Last 7 days" },
   { value: "14d", label: "Last 14 days" },
   { value: "30d", label: "Last 30 days" },
   { value: "90d", label: "Last 90 days" },
   { value: "180d", label: "Last 180 days" },
] as const;

const WINDOW_UNITS = [
   { value: "minute", label: "Minutes" },
   { value: "hour", label: "Hours" },
   { value: "day", label: "Days" },
   { value: "week", label: "Weeks" },
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
               label: `Step ${config.steps.length + 1}`,
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

   const dateRangeValue =
      config.dateRange.type === "relative" ? config.dateRange.value : "30d";

   return (
      <div className="space-y-6">
         <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Steps
            </Label>
            {config.steps.map((step, index) => (
               <div
                  className="flex items-center gap-2"
                  key={`step-${index + 1}`}
               >
                  <span className="text-xs font-bold text-muted-foreground w-5">
                     {index + 1}
                  </span>
                  <Input
                     className="flex-1"
                     onChange={(e) =>
                        updateStep(index, { event: e.target.value })
                     }
                     placeholder="Event name"
                     value={step.event}
                  />
                  <Input
                     className="w-[120px]"
                     onChange={(e) =>
                        updateStep(index, { label: e.target.value })
                     }
                     placeholder="Label"
                     value={step.label ?? ""}
                  />
                  {config.steps.length > 2 && (
                     <Button
                        className="size-8"
                        onClick={() => removeStep(index)}
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
               onClick={addStep}
               size="sm"
               variant="outline"
            >
               <Plus className="size-4 mr-1" />
               Add step
            </Button>
         </div>

         <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
               Conversion window
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
                           value: Number.parseInt(e.target.value) || 14,
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
