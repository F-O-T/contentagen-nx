import { Button } from "@packages/ui/components/button";
import { defineStepper } from "@packages/ui/components/stepper";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useAgentForm } from "../lib/use-agent-form";
import { BasicInfoStep, BasicInfoStepSubscribe } from "./basic-info-step";
import { BrandStep, BrandStepSubscribe } from "./brand-step";
import { VoiceToneStep, VoiceToneStepSubscribe } from "./voice-tone-step";
import {
   type PersonaConfig,
   PersonaConfigSchema,
} from "@packages/database/schema";
export const agentFormSchema = PersonaConfigSchema;

export type AgentForm = ReturnType<typeof useAgentForm>;
const steps = [
   { id: "step-basic-info", title: "Basic Information" },
   { id: "step-voice-tone", title: "Voice & Tone" },
   { id: "step-brand", title: "Brand" },
] as const;
const { Stepper } = defineStepper(...steps);

export type AgentCreationManualForm = {
   defaultValues?: Partial<PersonaConfig>;
   onSubmit: (values: PersonaConfig) => Promise<void>;
};

export function AgentCreationManualForm({
   onSubmit,
   defaultValues,
}: AgentCreationManualForm) {
   const { handleSubmit, form } = useAgentForm({ defaultValues, onSubmit });

   const getMascotMessage = (
      step: "step-basic-info" | "step-voice-tone" | "step-brand",
   ) => {
      switch (step) {
         case "step-basic-info":
            return "Let's give your content agent a special name!";
         case "step-voice-tone":
            return "Now, let's define your agent's voice and tone.";
         case "step-brand":
            return "Now, let's configure your agent's brand compliance and style.";
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

               <TalkingMascot
                  message={getMascotMessage(
                     methods.current.id as "step-basic-info" | "step-brand",
                  )}
               />

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
                           "step-voice-tone": () => (
                              <VoiceToneStep form={form} />
                           ),
                           "step-brand": () => <BrandStep form={form} />,
                        })}{" "}
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
                  <div>
                     {methods.switch({
                        "step-basic-info": () => (
                           <BasicInfoStepSubscribe
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
                        "step-brand": () => (
                           <BrandStepSubscribe
                              form={form}
                              next={methods.next}
                           />
                        ),
                     })}{" "}
                  </div>
               </Stepper.Controls>
            </form>
         )}
      </Stepper.Provider>
   );
}
