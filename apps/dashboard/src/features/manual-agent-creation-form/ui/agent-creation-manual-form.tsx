import { Button } from "@packages/ui/components/button";
import { defineStepper } from "@packages/ui/components/stepper";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useAgentForm } from "../lib/use-agent-form";
import {
   FormattingStyleStep,
   TargetAudienceStep,
   FormattingStyleStepSubscribe,
   TargetAudienceStepSubscribe,
} from "./audience-style-step";
import { BasicInfoStep, BasicInfoStepSubscribe } from "./basic-info-step";
import { ContentTypeStep, ContentTypeStepSubscribe } from "./content-type-step";
import {
   ReviewSubmitStep,
   ReviewSubmitStepSubscribe,
} from "./review-submit-step";
import { VoiceToneStep, VoiceToneStepSubscribe } from "./voice-tone-step";
import {
   BrandIntegrationStep,
   BrandIntegrationStepSubscribe,
} from "./brand-integration-step";

import {
   contentTypeEnum,
   formattingStyleEnum,
   targetAudienceEnum,
   voiceToneEnum,
   languageEnum,
   brandIntegrationEnum,
   communicationStyleEnum, // <-- Add this import
} from "@api/schemas/agent-schema";
import { z } from "zod";
import type { EdenClientType } from "@packages/eden";
export const agentFormSchema = z.object({
   contentType: z.enum(contentTypeEnum.enumValues, {
      required_error: "Content type is required",
   }),
   description: z.string().min(1, "Description is required"),
   formattingStyle: z.enum(formattingStyleEnum.enumValues).optional(),
   name: z.string().min(1, "Agent name is required"),
   targetAudience: z.enum(targetAudienceEnum.enumValues, {
      required_error: "Target audience is required",
   }),
   voiceTone: z.enum(voiceToneEnum.enumValues, {
      required_error: "Voice tone is required",
   }),
   language: z.enum(languageEnum.enumValues, {
      required_error: "Language is required",
   }),
   brandIntegration: z.enum(brandIntegrationEnum.enumValues, {
      required_error: "Brand integration is required",
   }),
   communicationStyle: z.enum(communicationStyleEnum.enumValues, {
      required_error: "Communication style is required",
   }), // <-- Add this field
});
export type AgentFormData = z.infer<typeof agentFormSchema>;
export type AgentForm = ReturnType<typeof useAgentForm>;
const steps = [
   { id: "step-basic-info", title: "Basic Information" },
   { id: "step-content-type", title: "Content Type" },
   { id: "step-voice-tone", title: "Voice Tone" },
   { id: "step-target-audience", title: "Target Audience" },
   { id: "step-formatting-style", title: "Formatting Style" },
   { id: "step-brand-integration", title: "Brand Integration" }, // New step
   { id: "step-brand-integration", title: "Brand Integration" }, // New step
   { id: "step-review-submit", title: "Review & Submit" },
] as const;

export type Agent = NonNullable<
   Awaited<ReturnType<EdenClientType["api"]["v1"]["agents"]["get"]>>["data"]
>["agents"][number];

const { Stepper } = defineStepper(...steps);
export type AgentCreationManualForm = {
   defaultValues?: Agent;
   onSubmit: (values: AgentFormData) => Promise<void>;
};

export function AgentCreationManualForm({
   onSubmit,
   defaultValues,
}: AgentCreationManualForm) {
   const { handleSubmit, form } = useAgentForm({ defaultValues, onSubmit });

   const getMascotMessage = (step: string) => {
      switch (step) {
         case "step-basic-info":
            return "Let's give your content agent a special name!";
         case "step-content-type":
            return "Now let's choose what type of content to create!";
         case "step-voice-tone":
            return "How should your agent communicate with your audience?";
         case "step-target-audience":
            return "Who will be reading your content?";
         case "step-formatting-style":
            return "How should your content be structured?";
         case "step-brand-integration":
            return "How closely should your agent follow your brand guidelines? Also, choose how your agent should communicate: as a singular person or in third person.";
         case "step-topics-seo":
            return "Let's add topics and keywords for SEO!";
         case "step-review-submit":
            return "Almost there! Let's review everything before creating your agent!";
         default:
            return "Let's create your content agent!";
      }
   };

   return (
      <Stepper.Provider
         labelOrientation="vertical"
         variant="horizontal"
         className="h-full w-full"
      >
         {({ methods }) => (
            <form
               className="h-full gap-8 flex flex-col"
               onSubmit={handleSubmit}
            >
               <Stepper.Navigation>
                  {steps.map((step, idx) => {
                     const currentIdx = steps.findIndex(
                        (s) => s.id === methods.current.id,
                     );
                     const isPastOrCurrent = idx <= currentIdx;
                     return (
                        <Stepper.Step
                           className={`bg-accent!important text-accent ${!isPastOrCurrent ? "cursor-not-allowed opacity-50 pointer-events-none" : ""}`}
                           key={step.id}
                           of={step.id}
                           onClick={() => {
                              if (isPastOrCurrent && idx !== currentIdx) {
                                 methods.goTo(step.id);
                              }
                           }}
                        />
                     );
                  })}
               </Stepper.Navigation>

               <TalkingMascot message={getMascotMessage(methods.current.id)} />

               <Stepper.Panel className="h-full ">
                  <AnimatePresence mode="wait" initial={false}>
                     <motion.div
                        className="h-full space-y-4"
                        key={methods.current.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                     >
                        {methods.switch({
                           "step-basic-info": () => (
                              <BasicInfoStep form={form} />
                           ),
                           "step-content-type": () => (
                              <ContentTypeStep form={form} />
                           ),
                           "step-voice-tone": () => (
                              <VoiceToneStep form={form} />
                           ),
                           "step-target-audience": () => (
                              <TargetAudienceStep form={form} />
                           ),
                           "step-formatting-style": () => (
                              <FormattingStyleStep form={form} />
                           ),
                           "step-brand-integration": () => (
                              <BrandIntegrationStep form={form} />
                           ),
                           "step-review-submit": () => (
                              <ReviewSubmitStep form={form} />
                           ),
                        })}
                     </motion.div>
                  </AnimatePresence>
               </Stepper.Panel>
               <Stepper.Controls
                  className="flex justify-between gap-4 "
                  id="navigation-controls"
               >
                  <div>
                     {!methods.isFirst && (
                        <Button
                           className="gap-4 "
                           onClick={methods.prev}
                           type="button"
                           variant="outline"
                        >
                           <ChevronLeft className="w-5 h-5" />
                           Back
                        </Button>
                     )}
                  </div>
                  <div className="flex gap-4">
                     {methods.switch({
                        "step-basic-info": () => (
                           <BasicInfoStepSubscribe
                              form={form}
                              next={methods.next}
                           />
                        ),
                        "step-content-type": () => (
                           <ContentTypeStepSubscribe
                              form={form}
                              next={methods.next}
                           />
                        ),
                        "step-voice-tone": () => (
                           <VoiceToneStepSubscribe
                              form={form}
                              next={methods.next}
                           />
                        ),
                        "step-target-audience": () => (
                           <TargetAudienceStepSubscribe
                              form={form}
                              next={methods.next}
                           />
                        ),
                        "step-formatting-style": () => (
                           <FormattingStyleStepSubscribe
                              form={form}
                              next={methods.next}
                           />
                        ),
                        "step-brand-integration": () => (
                           <BrandIntegrationStepSubscribe
                              form={form}
                              next={methods.next}
                           />
                        ),
                        "step-review-submit": () => (
                           <ReviewSubmitStepSubscribe form={form} />
                        ),
                     })}
                  </div>
               </Stepper.Controls>
            </form>
         )}
      </Stepper.Provider>
   );
}
