import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { PanelRight, Sparkles } from "lucide-react";
import {
   openContextPanel,
   setActiveTab,
   toggleContextPanel,
   useContextPanel,
} from "./use-context-panel";

export function ContextPanelHeaderActions() {
   const { isOpen } = useContextPanel();

   const handleOpenAI = () => {
      setActiveTab("chat");
      openContextPanel();
   };

   return (
      <TooltipProvider>
         <div className="flex items-center gap-1">
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className={cn(
                        "size-8 rounded",
                        isOpen && "bg-accent text-accent-foreground",
                     )}
                     onClick={handleOpenAI}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <Sparkles className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Abrir Chat IA</TooltipContent>
            </Tooltip>

            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className={cn(
                        "size-8 rounded",
                        isOpen && "bg-accent text-accent-foreground",
                     )}
                     onClick={toggleContextPanel}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <PanelRight className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {isOpen ? "Fechar painel" : "Abrir painel"}
               </TooltipContent>
            </Tooltip>
         </div>
      </TooltipProvider>
   );
}
