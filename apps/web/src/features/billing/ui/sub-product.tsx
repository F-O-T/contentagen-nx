import { Progress } from "@packages/ui/components/progress";

interface SubProductProps {
   name: string;
   current: number;
   limit?: number;
   cost?: number;
}

export function SubProduct({ name, current, limit, cost }: SubProductProps) {
   const percentage =
      limit !== undefined && limit > 0
         ? Math.min((current / limit) * 100, 100)
         : undefined;

   return (
      <div className="space-y-1.5">
         <div className="flex items-center justify-between">
            <span className="text-sm">{name}</span>
            <span className="text-sm tabular-nums">
               {current.toLocaleString()}
               {limit !== undefined && (
                  <span className="text-muted-foreground">
                     {" "}
                     / {limit.toLocaleString()}
                  </span>
               )}
            </span>
         </div>

         {percentage !== undefined && (
            <Progress className="h-1.5" value={percentage} />
         )}

         {cost !== undefined && (
            <p className="text-muted-foreground text-xs text-right">
               R$ {cost.toFixed(2)}
            </p>
         )}
      </div>
   );
}
