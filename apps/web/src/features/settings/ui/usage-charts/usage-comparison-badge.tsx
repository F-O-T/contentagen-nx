import { cn } from "@packages/ui/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface UsageComparisonBadgeProps {
   value: number; // percentage change
   label?: string;
   className?: string;
}

export function UsageComparisonBadge({
   value,
   label = "vs mês anterior",
   className,
}: UsageComparisonBadgeProps) {
   const isPositive = value > 0;
   const isNegative = value < 0;
   const isNeutral = value === 0;

   const formattedValue = Math.abs(value).toFixed(1);

   return (
      <div
         className={cn(
            "inline-flex items-center gap-1 text-xs",
            isPositive && "text-emerald-600 dark:text-emerald-400",
            isNegative && "text-red-600 dark:text-red-400",
            isNeutral && "text-muted-foreground",
            className,
         )}
      >
         {isPositive && <TrendingUp className="size-3" />}
         {isNegative && <TrendingDown className="size-3" />}
         {isNeutral && <Minus className="size-3" />}
         <span>
            {isPositive && "+"}
            {isNegative && "-"}
            {formattedValue}% {label}
         </span>
      </div>
   );
}
