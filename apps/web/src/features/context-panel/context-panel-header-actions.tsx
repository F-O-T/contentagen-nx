import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { PanelRight, Sparkles } from "lucide-react";
import { openContextPanel, setActiveTab } from "./use-context-panel";

export function ContextPanelHeaderActions() {
   const handleOpenAI = () => {
      setActiveTab("chat");
      openContextPanel();
   };

   const handleOpenPanel = () => {
      setActiveTab("info");
      openContextPanel();
   };

   return (
      <TooltipProvider>
         <div className="flex items-center gap-1">
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-8 rounded"
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
                     className="size-8 rounded"
                     onClick={handleOpenPanel}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <PanelRight className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Abrir painel</TooltipContent>
            </Tooltip>
         </div>
      </TooltipProvider>
   );
}
