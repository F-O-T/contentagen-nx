import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@packages/ui/components/button";

import { useNavigate } from "@tanstack/react-router";
export function ErrorComponent({
   error,
   reset,
}: {
   error: Error;
   reset: () => void;
}) {
   const navigate = useNavigate();
   return (
      <div className="flex items-center justify-center h-full w-full">
         <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="flex flex-col items-center gap-2">
               <AlertTriangle className="h-12 w-12 text-destructive" />
               <h2 className="text-2xl font-semibold">Something went wrong</h2>
            </div>
            <p className="text-muted-foreground">
               {error.message ||
                  "An unexpected error occurred while loading this page."}
            </p>
            <div className="flex gap-2">
               <Button onClick={reset} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
               </Button>
               <Button onClick={() => navigate({ to: "/home" })}>
                  Go Home
               </Button>
            </div>
         </div>
      </div>
   );
}

