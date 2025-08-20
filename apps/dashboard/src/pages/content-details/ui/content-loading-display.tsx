import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Progress } from "@packages/ui/components/progress";
import type { ContentStatus } from "@packages/database/schemas/content";
import { useMemo, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ContentLoadingDisplayProps {
   status: ContentStatus;
}

const contentSteps = [
   {
      id: "pending",
      label: "Initializing",
      description: "Setting up your content generation",
   },
   {
      id: "planning",
      label: "Planning",
      description: "Analyzing requirements and creating strategy",
   },
   {
      id: "researching",
      label: "Researching",
      description: "Gathering relevant information and data",
   },
   {
      id: "writing",
      label: "Writing",
      description: "Writing your content",
   },
   {
      id: "editing",
      label: "Editing",
      description: "Refining and polishing the content",
   },
   {
      id: "analyzing",
      label: "Analyzing",
      description: "Quality check and metadata generation",
   },
] as const;

export function ContentLoadingDisplay({ status }: ContentLoadingDisplayProps) {
   const containerRef = useRef<HTMLDivElement>(null);

   const currentStepIndex = useMemo(() => {
      const index = contentSteps.findIndex((step) => step.id === status);
      return index >= 0 ? index : 0;
   }, [status]);

   const progressPercentage = useMemo(() => {
      return Math.round(((currentStepIndex + 1) / contentSteps.length) * 100);
   }, [currentStepIndex]);

   const currentStep = useMemo(() => {
      return contentSteps[currentStepIndex];
   }, [currentStepIndex]);

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
   }, [currentStepIndex]);

   const getCurrentMessage = useMemo(() => {
      return `${currentStep?.description || "Processing your content"}...`;
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
                  Step {currentStepIndex + 1} of {contentSteps.length}
               </span>
               <span>•</span>
               <span>{progressPercentage}% complete</span>
            </div>
         </div>
      </div>
   );
}
