import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { cn } from "@packages/ui/lib/utils";
import type { DataTableSummaryCard } from "../types";

interface DataTableSummaryCardsProps {
   cards: DataTableSummaryCard[];
   className?: string;
   columns?: 2 | 3 | 4;
}

const GRID_COLS = {
   2: "grid-cols-2",
   3: "grid-cols-2 lg:grid-cols-3",
   4: "grid-cols-2 lg:grid-cols-4",
} as const;

export function DataTableSummaryCards({
   cards,
   className,
   columns = 4,
}: DataTableSummaryCardsProps) {
   return (
      <div className={cn("grid gap-4", GRID_COLS[columns], className)}>
         {cards.map((card) => (
            <StatsCard
               description={card.description}
               key={card.id}
               title={card.title}
               value={card.value}
            />
         ))}
      </div>
   );
}

interface DataTableSummaryCardsSkeletonProps {
   count?: number;
   columns?: 2 | 3 | 4;
   className?: string;
}

export function DataTableSummaryCardsSkeleton({
   count = 4,
   columns = 4,
   className,
}: DataTableSummaryCardsSkeletonProps) {
   return (
      <div className={cn("grid gap-4", GRID_COLS[columns], className)}>
         {Array.from({ length: count }).map((_, index) => (
            <Card key={`summary-skeleton-${index + 1}`}>
               <CardHeader>
                  <CardDescription>
                     <Skeleton className="h-4 w-20" />
                  </CardDescription>
                  <CardTitle>
                     <Skeleton className="h-8 w-16" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-3 w-32" />
                  </CardDescription>
               </CardHeader>
            </Card>
         ))}
      </div>
   );
}
