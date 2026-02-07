import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode, useState } from "react";

interface ProductCardProps {
   name: string;
   description?: string;
   icon?: ReactNode;
   currentUsage?: number;
   freeLimit?: number;
   monthToDate: number;
   projected: number;
   expandable?: boolean;
   children?: ReactNode;
}

export function ProductCard({
   name,
   description,
   icon,
   currentUsage,
   freeLimit,
   monthToDate,
   projected,
   expandable,
   children,
}: ProductCardProps) {
   const [isExpanded, setIsExpanded] = useState(false);

   const showProgress =
      freeLimit !== undefined && freeLimit > 0 && currentUsage !== undefined;

   const overLimit =
      showProgress && currentUsage !== undefined && currentUsage > freeLimit;

   const percentage = showProgress
      ? Math.min((currentUsage / freeLimit) * 100, 100)
      : 0;

   return (
      <Card>
         <CardHeader>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  {icon && <div className="text-muted-foreground">{icon}</div>}
                  <div>
                     <CardTitle>{name}</CardTitle>
                     {description && (
                        <CardDescription>{description}</CardDescription>
                     )}
                  </div>
               </div>

               {expandable && (
                  <button
                     className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                     onClick={() => setIsExpanded((prev) => !prev)}
                     type="button"
                  >
                     {isExpanded ? (
                        <ChevronDown className="size-4" />
                     ) : (
                        <ChevronRight className="size-4" />
                     )}
                  </button>
               )}
            </div>
         </CardHeader>

         <CardContent className="space-y-4">
            {showProgress && (
               <div className="space-y-2">
                  <Progress value={percentage} />
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">
                        {currentUsage.toLocaleString()} /{" "}
                        {freeLimit.toLocaleString()} inclusos
                     </span>
                     {overLimit && (
                        <span className="text-destructive text-xs font-medium">
                           Acima do limite
                        </span>
                     )}
                  </div>
               </div>
            )}

            <div className="flex items-center justify-between text-sm">
               <div>
                  <p className="text-muted-foreground">Custo no mes</p>
                  <p className="font-medium tabular-nums">
                     R$ {monthToDate.toFixed(2)}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-muted-foreground">Projetado</p>
                  <p className="font-medium tabular-nums">
                     R$ {projected.toFixed(2)}
                  </p>
               </div>
            </div>

            {expandable && isExpanded && children && (
               <div className="border-t pt-4 space-y-3">{children}</div>
            )}
         </CardContent>
      </Card>
   );
}
