import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Progress } from "@packages/ui/components/progress";
import type { ContentStatus } from "@packages/database/schemas/content";
import { useMemo, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { translate } from "@packages/localization";

interface ContentLoadingDisplayProps {
   status: ContentStatus;
}

const getContentSteps = () =>
   [
      {
         id: "pending",
         label: translate("pages.content-details.loading.steps.pending.label"),
         description: translate(
            "pages.content-details.loading.steps.pending.description",
         ),
      },
      {
         id: "planning",
         label: translate("pages.content-details.loading.steps.planning.label"),
         description: translate(
            "pages.content-details.loading.steps.planning.description",
         ),
      },
      {
         id: "researching",
         label: translate(
            "pages.content-details.loading.steps.researching.label",
         ),
         description: translate(
            "pages.content-details.loading.steps.researching.description",
         ),
      },
      {
         id: "writing",
         label: translate("pages.content-details.loading.steps.writing.label"),
         description: translate(
            "pages.content-details.loading.steps.writing.description",
         ),
      },
      {
         id: "grammar_checking",
         label: translate(
            "pages.content-details.loading.steps.grammar_checking.label",
         ),
         description: translate(
            "pages.content-details.loading.steps.grammar_checking.description",
         ),
      },
      {
         id: "editing",
         label: translate("pages.content-details.loading.steps.editing.label"),
         description: translate(
            "pages.content-details.loading.steps.editing.description",
         ),
      },
      {
         id: "analyzing",
         label: translate(
            "pages.content-details.loading.steps.analyzing.label",
         ),
         description: translate(
            "pages.content-details.loading.steps.analyzing.description",
         ),
      },
   ] as const;

export function ContentLoadingDisplay({ status }: ContentLoadingDisplayProps) {
   const containerRef = useRef<HTMLDivElement>(null);

   const contentSteps = useMemo(() => getContentSteps(), []);

   const currentStepIndex = useMemo(() => {
      const index = contentSteps.findIndex((step) => step.id === status);
      return index >= 0 ? index : 0;
   }, [status, contentSteps]);

   const progressPercentage = useMemo(() => {
      return Math.round(((currentStepIndex + 1) / contentSteps.length) * 100);
   }, [currentStepIndex, contentSteps.length]);

   const currentStep = useMemo(() => {
      return contentSteps[currentStepIndex];
   }, [currentStepIndex, contentSteps]);

   useEffect(() => {
      if (containerRef.current) {
         const container = containerRef.current;
         const stepWidth = container.scrollWidth / contentSteps.length;
         const targetScrollPosition =
            stepWidth * currentStepIndex -
            container.clientWidth / 2 +
            stepWidth / 2;

         container.scrollTo({
            left: Math.max(0, targetScrollPosition),
            behavior: "smooth",
         });
      }
   }, [currentStepIndex, contentSteps.length]);

   const getCurrentMessage = useMemo(() => {
      return `${currentStep?.description || translate("pages.content-details.loading.progress.fallback-message")}...`;
   }, [currentStep]);

   return (
      <div className="grid grid-cols-1 gap-8">
         <TalkingMascot message={getCurrentMessage} />
         <div>
            {currentStep && (
               <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                     <Loader2 className="h-16 w-16 animate-spin text-primary" />
                     <div className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse" />
                     <div className="absolute -inset-3 rounded-full border border-primary/30 animate-ping" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary text-center">
                     {currentStep.label}
                  </h3>
               </div>
            )}
         </div>
         <div className="flex flex-col items-center space-y-2">
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <span>
                  {translate(
                     "pages.content-details.loading.progress.step-counter",
                     {
                        current: currentStepIndex + 1,
                        total: contentSteps.length,
                     },
                  )}
               </span>
               <span>•</span>
               <span>
                  {translate(
                     "pages.content-details.loading.progress.percentage",
                     { percent: progressPercentage },
                  )}
               </span>
            </div>
         </div>
      </div>
   );
}
