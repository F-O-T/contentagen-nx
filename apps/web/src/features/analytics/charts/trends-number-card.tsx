import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { cn } from "@packages/ui/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { memo } from "react";

interface TrendsNumberCardProps {
   value: string | number;
   label: string;
   trend?: { value: number; direction: "up" | "down"; comparison: string };
}

function formatTrendValue(value: number): string {
   const sign = value >= 0 ? "+" : "";
   return `${sign}${value.toFixed(1)}%`;
}

export const TrendsNumberCard = memo(function TrendsNumberCard({
   value,
   label,
   trend,
}: TrendsNumberCardProps) {
   const formattedValue =
      typeof value === "number" ? value.toLocaleString("pt-BR") : value;

   return (
      <Card>
         <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
               {label}
            </CardTitle>
         </CardHeader>
         <CardContent>
            <div className="text-3xl font-bold tabular-nums">
               {formattedValue}
            </div>
            {trend && (
               <div
                  className={cn(
                     "flex items-center gap-1 text-sm mt-2",
                     trend.direction === "up"
                        ? "text-green-600"
                        : "text-red-600",
                  )}
               >
                  {trend.direction === "up" ? (
                     <TrendingUp className="size-4" />
                  ) : (
                     <TrendingDown className="size-4" />
                  )}
                  <span className="tabular-nums">
                     {formatTrendValue(
                        trend.direction === "up" ? trend.value : -trend.value,
                     )}{" "}
                     {trend.comparison}
                  </span>
               </div>
            )}
         </CardContent>
      </Card>
   );
});
