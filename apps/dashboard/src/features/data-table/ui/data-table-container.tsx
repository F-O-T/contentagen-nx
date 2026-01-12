import { Card, CardContent } from "@packages/ui/components/card";
import { cn } from "@packages/ui/lib/utils";
import type { ReactNode } from "react";

interface DataTableContainerProps {
   children: ReactNode;
   /** Search bar component to render inside container */
   searchBar?: ReactNode;
   /** Additional content above the table (e.g., filters inside card) */
   toolbar?: ReactNode;
   className?: string;
}

export function DataTableContainer({
   children,
   searchBar,
   toolbar,
   className,
}: DataTableContainerProps) {
   return (
      <Card className={cn("", className)}>
         <CardContent className="space-y-4">
            {(searchBar || toolbar) && (
               <div className="flex flex-col gap-3">
                  {searchBar}
                  {toolbar}
               </div>
            )}
            {children}
         </CardContent>
      </Card>
   );
}
