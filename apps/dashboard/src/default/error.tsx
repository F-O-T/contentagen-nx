import mascot from "@packages/brand/logo.svg";
import { Button } from "@packages/ui/components/button";

import { useNavigate } from "@tanstack/react-router";
export function ErrorComponent({ error }: { error: Error }) {
   const navigate = useNavigate();
   return (
      <div className="flex items-center justify-center h-screen w-screen">
         <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="flex flex-col items-center gap-4">
               <div className="flex-shrink-0">
                  <img
                     alt="Content Agent Mascot"
                     className="w-20 h-20 shadow-lg"
                     src={mascot}
                  />
               </div>
               <div className="flex flex-col items-center gap-2">
                  <h2 className="text-2xl font-semibold">
                     Something went wrong
                  </h2>
               </div>
            </div>
            <p className="text-muted-foreground">
               {error.message ||
                  "An unexpected error occurred while loading this page."}
            </p>
            <div className="flex gap-2">
               <Button onClick={() => navigate({ to: "/home" })}>
                  Go Home
               </Button>
            </div>
         </div>
      </div>
   );
}
