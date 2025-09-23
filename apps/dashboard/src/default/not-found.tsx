import { Search } from "lucide-react";
import { Button } from "@packages/ui/components/button";
import { useNavigate } from "@tanstack/react-router";

export function NotFoundComponent() {
   const navigate = useNavigate();

   return (
      <div className="flex items-center justify-center h-full w-full">
         <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="flex flex-col items-center gap-2">
               <div className="text-9xl font-bold text-muted-foreground">
                  404
               </div>
               <h2 className="text-2xl font-semibold">Page Not Found</h2>
            </div>
            <p className="text-muted-foreground">
               The page you're looking for doesn't exist or has been moved.
            </p>
            <Button onClick={() => navigate({ to: "/home" })}>
               <Search className="mr-2 h-4 w-4" />
               Go to Dashboard
            </Button>
         </div>
      </div>
   );
}

