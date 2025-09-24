import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Progress } from "@packages/ui/components/progress";
import type { CompetitorFeaturesStatus } from "@packages/database/schemas/competitor";
import { useMemo, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { translate } from "@packages/localization";

interface CompetitorLoadingDisplayProps {
   status: CompetitorFeaturesStatus;
}

const getCompetitorSteps = () =>
   [
      {
         id: "pending",
         label: translate(
            "pages.competitor-details.loading.steps.pending.label",
         ),
         description: translate(
            "pages.competitor-details.loading.steps.pending.description",
         ),
      },
      {
         id: "crawling",
         label: translate(
            "pages.competitor-details.loading.steps.crawling.label",
         ),
         description: translate(
            "pages.competitor-details.loading.steps.crawling.description",
         ),
      },
      {
         id: "analyzing",
         label: translate(
            "pages.competitor-details.loading.steps.analyzing.label",
         ),
         description: translate(
            "pages.competitor-details.loading.steps.analyzing.description",
         ),
      },
   ] as const;

export function CompetitorLoadingDisplay({
   status,
}: CompetitorLoadingDisplayProps) {
   const containerRef = useRef<HTMLDivElement>(null);

   const competitorSteps = useMemo(() => getCompetitorSteps(), []);

   const currentStepIndex = useMemo(() => {
      const index = competitorSteps.findIndex((step) => step.id === status);
      return index >= 0 ? index : 0;
   }, [status, competitorSteps]);

   const progressPercentage = useMemo(() => {
      return Math.round(
         ((currentStepIndex + 1) / competitorSteps.length) * 100,
      );
   }, [currentStepIndex, competitorSteps.length]);

   const currentStep = useMemo(() => {
      return competitorSteps[currentStepIndex];
   }, [currentStepIndex, competitorSteps]);

   useEffect(() => {
      if (containerRef.current) {
         const container = containerRef.current;
         const stepWidth = container.scrollWidth / competitorSteps.length;
         const targetScrollPosition =
            stepWidth * currentStepIndex -
            container.clientWidth / 2 +
            stepWidth / 2;

         container.scrollTo({
            left: Math.max(0, targetScrollPosition),
            behavior: "smooth",
         });
      }
   }, [currentStepIndex, competitorSteps.length]);

   const getCurrentMessage = useMemo(() => {
      return `${currentStep?.description || translate("pages.competitor-details.loading.progress.fallback-message")}...`;
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
                     "pages.competitor-details.loading.progress.step-counter",
                     {
                        current: currentStepIndex + 1,
                        total: competitorSteps.length,
                     },
                  )}
               </span>
               <span>•</span>
               <span>
                  {translate(
                     "pages.competitor-details.loading.progress.percentage",
                     { percent: progressPercentage },
                  )}
               </span>
            </div>
         </div>
      </div>
   );
}
