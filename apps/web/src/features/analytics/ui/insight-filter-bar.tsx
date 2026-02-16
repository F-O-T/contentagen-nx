import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { cn } from "@packages/ui/lib/utils";
import {
   AreaChart,
   BarChart3,
   Calendar,
   ChevronDown,
   GitCompareArrows,
   Hash,
   LineChart,
   type LucideIcon,
} from "lucide-react";
import type { InsightType } from "@/features/analytics/hooks/use-insight-config";

interface InsightFilterBarProps {
   type: InsightType;
   dateRange: string;
   onDateRangeChange: (value: string) => void;
   interval?: string;
   onIntervalChange?: (value: string) => void;
   chartType?: string;
   onChartTypeChange?: (value: string) => void;
   compare?: boolean;
   onCompareChange?: (value: boolean) => void;
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
];

const INTERVAL_OPTIONS = [
   { value: "hour", label: "Hora" },
   { value: "day", label: "Dia" },
   { value: "week", label: "Semana" },
   { value: "month", label: "Mês" },
];

interface ChartTypeOption {
   value: string;
   label: string;
   description: string;
   icon: LucideIcon;
   group: string;
}

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
   {
      value: "line",
      label: "Linha",
      description: "Tendência ao longo do tempo como linha contínua.",
      icon: LineChart,
      group: "Séries temporais",
   },
   {
      value: "area",
      label: "Área",
      description: "Tendência ao longo do tempo como área sombreada.",
      icon: AreaChart,
      group: "Séries temporais",
   },
   {
      value: "bar",
      label: "Barras",
      description: "Tendência ao longo do tempo como barras verticais.",
      icon: BarChart3,
      group: "Séries temporais",
   },
   {
      value: "number",
      label: "Número",
      description: "Um número grande mostrando o valor total.",
      icon: Hash,
      group: "Valor total",
   },
];

function getDateRangeLabel(value: string): string {
   const preset = DATE_RANGE_PRESETS.find((p) => p.value === value);
   return preset?.label || value;
}

function getChartTypeOption(value: string): ChartTypeOption | undefined {
   return CHART_TYPE_OPTIONS.find((o) => o.value === value);
}

export function InsightFilterBar({
   type,
   dateRange,
   onDateRangeChange,
   interval,
   onIntervalChange,
   chartType,
   onChartTypeChange,
   compare,
   onCompareChange,
}: InsightFilterBarProps) {
   const isTrends = type === "trends";
   const activeChart = chartType ? getChartTypeOption(chartType) : undefined;
   const ActiveChartIcon = activeChart?.icon;

   const groups = [...new Set(CHART_TYPE_OPTIONS.map((o) => o.group))];

   return (
      <div className="flex items-center justify-between gap-3 border-b py-2">
         <div className="flex items-center gap-2">
            {/* Date Range Selector */}
            <Popover>
               <PopoverTrigger asChild>
                  <Button className="h-7 text-xs" size="sm" variant="outline">
                     <Calendar className="mr-1.5 size-3.5" />
                     {getDateRangeLabel(dateRange)}
                  </Button>
               </PopoverTrigger>
               <PopoverContent align="start" className="w-56 p-2">
                  <div className="space-y-1">
                     {DATE_RANGE_PRESETS.map((preset) => (
                        <Button
                           className={cn(
                              "w-full justify-start text-xs",
                              dateRange === preset.value && "bg-accent",
                           )}
                           key={preset.value}
                           onClick={() => onDateRangeChange(preset.value)}
                           size="sm"
                           variant="ghost"
                        >
                           {preset.label}
                        </Button>
                     ))}
                  </div>
               </PopoverContent>
            </Popover>

            {/* Interval Selector (Trends only) */}
            {isTrends && interval && onIntervalChange && (
               <Select onValueChange={onIntervalChange} value={interval}>
                  <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
                     <span className="text-muted-foreground">agrupado por</span>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                           {option.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            )}

            {/* Compare Toggle (Trends only) */}
            {isTrends && onCompareChange !== undefined && (
               <Button
                  className="h-7 text-xs"
                  onClick={() => onCompareChange(!compare)}
                  size="sm"
                  variant="outline"
               >
                  <GitCompareArrows className="mr-1.5 size-3.5" />
                  {compare ? "Comparando períodos" : "Sem comparação"}
               </Button>
            )}
         </div>

         {/* Chart Type Dropdown (Trends only) */}
         {isTrends && chartType && onChartTypeChange && (
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button
                     className="h-7 text-xs gap-1.5"
                     size="sm"
                     variant="outline"
                  >
                     {ActiveChartIcon && (
                        <ActiveChartIcon className="size-3.5" />
                     )}
                     {activeChart?.label ?? "Gráfico"}
                     <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-72">
                  {groups.map((group, groupIdx) => (
                     <div key={group}>
                        {groupIdx > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                           {group}
                        </DropdownMenuLabel>
                        {CHART_TYPE_OPTIONS.filter(
                           (o) => o.group === group,
                        ).map((option) => {
                           const Icon = option.icon;
                           return (
                              <DropdownMenuItem
                                 className={cn(
                                    "flex items-start gap-3 py-2",
                                    chartType === option.value && "bg-accent",
                                 )}
                                 key={option.value}
                                 onClick={() => onChartTypeChange(option.value)}
                              >
                                 <Icon className="size-4 mt-0.5 shrink-0" />
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">
                                       {option.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                       {option.description}
                                    </span>
                                 </div>
                              </DropdownMenuItem>
                           );
                        })}
                     </div>
                  ))}
               </DropdownMenuContent>
            </DropdownMenu>
         )}
      </div>
   );
}
