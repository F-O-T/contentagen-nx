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
import { TopicsSeoStep, TopicsSeoStepSubscribe } from "./topics-seo-step";
import { VoiceToneStep, VoiceToneStepSubscribe } from "./voice-tone-step";

const steps = [
   { id: "step-basic-info", title: "Basic Information" },
   { id: "step-content-type", title: "Content Type" },
   { id: "step-voice-tone", title: "Voice Tone" },
   { id: "step-target-audience", title: "Target Audience" },
   { id: "step-formatting-style", title: "Formatting Style" },
   { id: "step-topics-seo", title: "Topics & SEO" },
   { id: "step-review-submit", title: "Review & Submit" },
] as const;

const { Stepper } = defineStepper(...steps);

export function CreateAgentPage() {
   const { handleSubmit, form } = useAgentForm();

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
                           "step-topics-seo": () => (
                              <TopicsSeoStep form={form} />
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
                        "step-topics-seo": () => (
                           <TopicsSeoStepSubscribe
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
