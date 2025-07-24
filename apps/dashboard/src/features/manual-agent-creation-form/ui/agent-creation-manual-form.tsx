import { Button } from "@packages/ui/components/button";
import { defineStepper } from "@packages/ui/components/stepper";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useAgentForm } from "../lib/use-agent-form";
import { BasicInfoStep, BasicInfoStepSubscribe } from "./basic-info-step";
import { Type, Static } from "@sinclair/typebox";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { AudienceStep } from "./audience-step";
export const agentFormSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Agent name is required"),
  description: z.string().min(1, "Description is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),

  // Voice & Tone
  toneMix: z.array(
    z.object({ value: z.string(), weight: z.number().min(0).max(1) }),
  ),
  formality: z.number().min(0).max(1),
  humorLevel: z.number().min(0).max(1),
  emojiDensity: z.number().min(0).max(1),
  readingGrade: z.number().min(1).max(12),
  communication: z.enum(["I", "we", "you"]),
  forbiddenWords: z.array(z.string()).optional(),
  requiredHooks: z.array(z.string()).optional(),

  // Audience
  audienceBase: z.enum([
    "general_public",
    "professionals",
    "beginners",
    "customers",
  ]),
  audiencePersonas: z.array(z.string()).optional(),
  audienceRegions: z.string().optional(),
  // Formatting & Structure
  formattingStyle: z.enum(["structured", "narrative", "list_based"]),
  headingDensity: z.enum(["low", "medium", "high"]).optional(),
  listStyle: z.enum(["bullets", "numbered"]).optional(),
  includeToc: z.boolean().optional(),
  maxParagraphLen: z.number().min(20).optional(),

  // Language
  languagePrimary: z.enum(["en", "pt", "es"]),
  languageVariant: z.string().optional(),

  // Brand Integration
  brandIntegrationStyle: z.enum([
    "strict_guideline",
    "flexible_guideline",
    "reference_only",
    "creative_blend",
  ]),
  brandAssets: z
    .array(z.object({ type: z.string(), payload: z.any() }))
    .optional(),
  brandBlacklistWords: z.array(z.string()).optional(),
  brandProductNames: z.array(z.string()).optional(),
  brandCompliance: z
    .object({
      gdpr: z.boolean().optional(),
      hipaa: z.boolean().optional(),
      fda: z.boolean().optional(),
    })
    .optional(),

  // Repurposing
  repurposePillarId: z.string().uuid().optional(),
  repurposeChannels: z.array(
    z.enum([
      "blog_post",
      "linkedin_post",
      "twitter_thread",
      "instagram_post",
      "instagram_story",
      "tiktok_script",
      "email_newsletter",
      "reddit_post",
      "youtube_script",
      "slide_deck",
      "video_script",
      "technical_documentation",
    ]),
  ),
  repurposePromptTemplate: z.string().optional(),
});
export type AgentFormData = z.infer<typeof agentFormSchema>;
export type AgentForm = ReturnType<typeof useAgentForm>;
const steps = [
  { id: "step-basic-info", title: "Basic Information" },
  { id: "step-audience", title: "Audience" },
  { id: "step-voice-tone", title: "Voice & Tone" },
  { id: "step-formatting", title: "Formatting & Structure" },
  { id: "step-language", title: "Language" },
  { id: "step-brand", title: "Brand Integration" },
  { id: "step-repurposing", title: "Repurposing" },
  { id: "step-review-submit", title: "Review & Submit" },
] as const;
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
        <form className="h-full gap-8 flex flex-col" onSubmit={handleSubmit}>
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
                  "step-basic-info": () => <BasicInfoStep form={form} />,
                  "step-audience": () => <AudienceStep form={form} />,
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
                  <BasicInfoStepSubscribe form={form} next={methods.next} />
                ),
              })}
            </div>
          </Stepper.Controls>
        </form>
      )}
    </Stepper.Provider>
  );
}
