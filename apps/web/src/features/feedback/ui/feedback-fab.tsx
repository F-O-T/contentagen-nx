import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { Bug, ExternalLink, Lightbulb, MessageSquarePlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCredenza } from "@/hooks/use-credenza";
import { useApiErrorTracker } from "../hooks/use-api-error-tracker";
import { BugReportForm } from "./bug-report-form";
import { FeatureRequestForm } from "./feature-request-form";

const DOCS_URL = "https://docs.contentta.com";

export function FeedbackFab() {
   const [open, setOpen] = useState(false);
   const { openCredenza, closeCredenza } = useCredenza();
   const { shouldShowBugReport, dismiss } = useApiErrorTracker();

   const openBugReport = useCallback(() => {
      setOpen(false);
      openCredenza({
         children: (
            <BugReportForm
               onSuccess={() => {
                  dismiss();
                  closeCredenza();
               }}
            />
         ),
      });
   }, [openCredenza, closeCredenza, dismiss]);

   const openFeatureRequest = () => {
      setOpen(false);
      openCredenza({
         children: <FeatureRequestForm onSuccess={closeCredenza} />,
      });
   };

   // Auto-trigger bug report on too many API errors
   useEffect(() => {
      if (shouldShowBugReport) {
         openBugReport();
      }
   }, [shouldShowBugReport, openBugReport]);

   return (
      <div className="fixed bottom-6 right-6 z-50">
         <Popover onOpenChange={setOpen} open={open}>
            <Tooltip>
               <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                     <Button
                        className="size-12 cursor-pointer rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                        size="icon"
                     >
                        <MessageSquarePlus className="size-5" />
                     </Button>
                  </PopoverTrigger>
               </TooltipTrigger>
               <TooltipContent side="left">Feedback</TooltipContent>
            </Tooltip>
            <PopoverContent
               align="end"
               className="w-56 p-2"
               side="top"
               sideOffset={8}
            >
               <div className="flex flex-col gap-1">
                  <Button
                     className="justify-start gap-3"
                     onClick={openBugReport}
                     variant="ghost"
                  >
                     <Bug className="size-4 text-red-500" />
                     <span>Reportar Bug</span>
                  </Button>
                  <Button
                     className="justify-start gap-3"
                     onClick={openFeatureRequest}
                     variant="ghost"
                  >
                     <Lightbulb className="size-4 text-amber-500" />
                     <span>Sugerir Feature</span>
                  </Button>
                  <Button
                     asChild
                     className="justify-start gap-3"
                     variant="ghost"
                  >
                     <a
                        href={DOCS_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                     >
                        <ExternalLink className="size-4 text-blue-500" />
                        <span>Documentação</span>
                     </a>
                  </Button>
               </div>
            </PopoverContent>
         </Popover>
      </div>
   );
}
