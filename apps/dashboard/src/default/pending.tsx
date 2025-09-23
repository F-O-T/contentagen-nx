import { Loader2 } from "lucide-react";

export function PendingComponent() {
   return (
      <div className="flex items-center justify-center h-full w-full">
         <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
               <h2 className="text-lg font-semibold">Loading</h2>
               <p className="text-sm text-muted-foreground">
                  Please wait while we prepare your dashboard...
               </p>
            </div>
         </div>
      </div>
   );
}

