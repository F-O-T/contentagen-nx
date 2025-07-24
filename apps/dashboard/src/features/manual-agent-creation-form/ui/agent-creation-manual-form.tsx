import { Button } from "@packages/ui/components/button";
import { defineStepper } from "@packages/ui/components/stepper";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useAgentForm } from "../lib/use-agent-form";
import { BasicInfoStep, BasicInfoStepSubscribe } from "./basic-info-step";
import { Type, type Static } from "@sinclair/typebox";
export const agentFormSchema = Type.Object({
   // Basic Information
   name: Type.String({ minLength: 1 }),
   description: Type.String({ minLength: 1 }),
   systemPrompt: Type.String({ minLength: 1 }),

   // Voice & Tone
   toneMix: Type.Array(
      Type.Object({
         value: Type.String(),
         weight: Type.Number({ minimum: 0, maximum: 1 }),
      }),
   ),
   formality: Type.Number({ minimum: 0, maximum: 1 }),
   humorLevel: Type.Number({ minimum: 0, maximum: 1 }),
   emojiDensity: Type.Number({ minimum: 0, maximum: 1 }),
   readingGrade: Type.Number({ minimum: 1, maximum: 12 }),
   communication: Type.Union([
      Type.Literal("I"),
      Type.Literal("we"),
      Type.Literal("you"),
   ]),
   forbiddenWords: Type.Optional(Type.Array(Type.String())),
   requiredHooks: Type.Optional(Type.Array(Type.String())),

   // Audience
   audienceBase: Type.Union([
      Type.Literal("general_public"),
      Type.Literal("professionals"),
      Type.Literal("beginners"),
      Type.Literal("customers"),
   ]),
   audiencePersonas: Type.Optional(Type.Array(Type.String())),
   audienceRegions: Type.Optional(Type.String()),

   // Formatting & Structure
   formattingStyle: Type.Union([
      Type.Literal("structured"),
      Type.Literal("narrative"),
      Type.Literal("list_based"),
   ]),
   headingDensity: Type.Optional(
      Type.Union([
         Type.Literal("low"),
         Type.Literal("medium"),
         Type.Literal("high"),
      ]),
   ),
   listStyle: Type.Optional(
      Type.Union([Type.Literal("bullets"), Type.Literal("numbered")]),
   ),
   includeToc: Type.Optional(Type.Boolean()),
   maxParagraphLen: Type.Optional(Type.Number({ minimum: 20 })),

   // Language
   languagePrimary: Type.Union([
      Type.Literal("en"),
      Type.Literal("pt"),
      Type.Literal("es"),
   ]),
   languageVariant: Type.Optional(Type.String()),

   // Brand Integration
   brandIntegrationStyle: Type.Union([
      Type.Literal("strict_guideline"),
      Type.Literal("flexible_guideline"),
      Type.Literal("reference_only"),
      Type.Literal("creative_blend"),
   ]),
   brandAssets: Type.Optional(
      Type.Array(Type.Object({ type: Type.String(), payload: Type.Any() })),
   ),
   brandBlacklistWords: Type.Optional(Type.Array(Type.String())),
   brandProductNames: Type.Optional(Type.Array(Type.String())),
   brandCompliance: Type.Optional(
      Type.Object({
         gdpr: Type.Optional(Type.Boolean()),
         hipaa: Type.Optional(Type.Boolean()),
         fda: Type.Optional(Type.Boolean()),
      }),
   ),

   // Repurposing
   repurposePillarId: Type.Optional(Type.String({ format: "uuid" })),
   repurposeChannels: Type.Array(
      Type.Union([
         Type.Literal("blog_post"),
         Type.Literal("linkedin_post"),
         Type.Literal("twitter_thread"),
         Type.Literal("instagram_post"),
         Type.Literal("instagram_story"),
         Type.Literal("tiktok_script"),
         Type.Literal("email_newsletter"),
         Type.Literal("reddit_post"),
         Type.Literal("youtube_script"),
         Type.Literal("slide_deck"),
         Type.Literal("video_script"),
         Type.Literal("technical_documentation"),
      ]),
   ),
   repurposePromptTemplate: Type.Optional(Type.String()),
});
export type AgentFormData = Static<typeof agentFormSchema>;

export type AgentForm = ReturnType<typeof useAgentForm>;
const steps = [{ id: "step-basic-info", title: "Basic Information" }] as const;
const { Stepper } = defineStepper(...steps);
export type AgentCreationManualForm = {
   defaultValues?: any;
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
                     })}
                  </div>
               </Stepper.Controls>
            </form>
         )}
      </Stepper.Provider>
   );
}
