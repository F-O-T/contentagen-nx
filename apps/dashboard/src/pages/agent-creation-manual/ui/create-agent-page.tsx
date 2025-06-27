import mascot from "@packages/brand/logo.svg";
import { Button } from "@packages/ui/components/button";

import { defineStepper } from "@packages/ui/components/stepper";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useAgentForm } from "../lib/use-agent-form";
import { FormattingStyleStep, TargetAudienceStep } from "./audience-style-step";
import { BasicInfoStep } from "./basic-info-step";
import { ContentTypeStep } from "./content-type-step";
import { ReviewSubmitStep } from "./review-submit-step";
import TopicsSeoStep from "./topics-seo-step";
import { Typewriter } from "./typewriter";
import VoiceToneStep from "./voice-tone-step";

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
  const { handleSubmit, form, isLoading } = useAgentForm();

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
      className="h-full w-full flex flex-col space-y-8 "
    >
      {({ methods }) => (
        <>
          <Stepper.Navigation>
            {steps.map((step) => (
              <Stepper.Step
                key={step.id}
                of={step.id}
                onClick={() => methods.goTo(step.id)}
              />
            ))}
          </Stepper.Navigation>

          <div className="flex items-start gap-4 w-full" id="mascot-speech">
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  alt="Content Agent Mascot"
                  className="w-10 h-10 rounded-full shadow-lg border-white border-2"
                  src={mascot}
                />
                <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-green-400 border-2 border-white">
                  <span className="w-1 h-1 rounded-full bg-white" />
                </span>
              </div>
            </div>
            <div className="relative flex-1 px-4 py-2 bg-white rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 ease-in-out">
              <span className="absolute left-[-8px] top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-12 border-r-white" />
              <Typewriter
                key={methods.current.id}
                message={getMascotMessage(methods.current.id)}
              />
            </div>
          </div>

          <form  onSubmit={handleSubmit}>
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
                    "step-content-type": () => <ContentTypeStep form={form} />,
                    "step-voice-tone": () => <VoiceToneStep form={form} />,
                    "step-target-audience": () => (
                      <TargetAudienceStep form={form} />
                    ),
                    "step-formatting-style": () => (
                      <FormattingStyleStep form={form} />
                    ),
                    "step-basic-info": () => <BasicInfoStep form={form} />,
                    "step-topics-seo": () => <TopicsSeoStep form={form} />,
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
                    <form.Subscribe
                      selector={(state) => ({
                        nameValue: state.values.name,
                        descriptionValue: state.values.description,
                        fieldMeta: state.fieldMeta,
                      })}
                    >
                      {({ nameValue, descriptionValue, fieldMeta }) => {
                        const nameErrors = fieldMeta?.name?.errors;
                        const emailErrors = fieldMeta?.description?.errors;

                        const isNameValid =
                          nameValue?.trim() !== "" &&
                          (!nameErrors || nameErrors.length === 0);
                        const isEmailValid =
                          descriptionValue?.trim() !== "" &&
                          (!emailErrors || emailErrors.length === 0);
                        const canGoNext = isNameValid && isEmailValid;

                        return (
                          <Button
                            onClick={methods.next}
                            type="button"
                            disabled={!canGoNext}
                          >
                            Next
                          </Button>
                        );
                      }}
                    </form.Subscribe>
                  ),
                  "step-content-type": () => (
                    <form.Subscribe
                      selector={(state) => ({
                        contentType: state.values.contentType,
                        contentTypeErrors: state.fieldMeta?.contentType?.errors,
                      })}
                    >
                      {({ contentType, contentTypeErrors }) => {
                        const isContentTypeValid =
                          contentType &&
                          (!contentTypeErrors ||
                            contentTypeErrors.length === 0);
                        return (
                          <Button
                            className="gap-4"
                            onClick={methods.next}
                            type="button"
                            disabled={!isContentTypeValid}
                          >
                            Next
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        );
                      }}
                    </form.Subscribe>
                  ),
                  "step-voice-tone": () => (
                    <form.Subscribe
                      selector={(state) => ({
                        voiceTone: state.values.voiceTone,
                        voiceToneErrors: state.fieldMeta?.voiceTone?.errors,
                      })}
                    >
                      {({ voiceTone, voiceToneErrors }) => {
                        const isVoiceToneValid =
                          voiceTone &&
                          (!voiceToneErrors || voiceToneErrors.length === 0);
                        return (
                          <Button
                            className="gap-4"
                            onClick={methods.next}
                            type="button"
                            disabled={!isVoiceToneValid}
                          >
                            Next
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        );
                      }}
                    </form.Subscribe>
                  ),
                  "step-target-audience": () => (
                    <form.Subscribe
                      selector={(state) => ({
                        targetAudience: state.values.targetAudience,
                        targetAudienceErrors:
                          state.fieldMeta?.targetAudience?.errors,
                      })}
                    >
                      {({ targetAudience, targetAudienceErrors }) => {
                        const isTargetAudienceValid =
                          targetAudience &&
                          (!targetAudienceErrors ||
                            targetAudienceErrors.length === 0);
                        return (
                          <Button
                            className="gap-4"
                            onClick={methods.next}
                            type="button"
                            disabled={!isTargetAudienceValid}
                          >
                            Next
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        );
                      }}
                    </form.Subscribe>
                  ),
                  "step-formatting-style": () => (
                    <form.Subscribe
                      selector={(state) => ({
                        formattingStyle: state.values.formattingStyle,
                        formattingStyleErrors:
                          state.fieldMeta?.formattingStyle?.errors,
                      })}
                    >
                      {({ formattingStyle, formattingStyleErrors }) => {
                        const isFormattingStyleValid =
                          formattingStyle &&
                          (!formattingStyleErrors ||
                            formattingStyleErrors.length === 0);
                        return (
                          <Button
                            className="gap-4"
                            onClick={methods.next}
                            type="button"
                            disabled={!isFormattingStyleValid}
                          >
                            Next
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        );
                      }}
                    </form.Subscribe>
                  ),
                  "step-topics-seo": () => (
                    <form.Subscribe
                      selector={(state) => ({
                        topics: state.values.topics,
                        seoKeywords: state.values.seoKeywords,
                        topicsErrors: state.fieldMeta?.topics?.errors,
                        seoKeywordsErrors: state.fieldMeta?.seoKeywords?.errors,
                      })}
                    >
                      {({
                        topics,
                        seoKeywords,
                        topicsErrors,
                        seoKeywordsErrors,
                      }) => {
                        const isTopicsValid =
                          Array.isArray(topics) &&
                          topics.length > 0 &&
                          (!topicsErrors || topicsErrors.length === 0);
                        const isSeoKeywordsValid =
                          Array.isArray(seoKeywords) &&
                          seoKeywords.length > 0 &&
                          (!seoKeywordsErrors ||
                            seoKeywordsErrors.length === 0);
                        const canGoNext = isTopicsValid && isSeoKeywordsValid;
                        return (
                          <Button
                            className="gap-4"
                            onClick={methods.next}
                            type="button"
                            disabled={!canGoNext}
                          >
                            Next
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        );
                      }}
                    </form.Subscribe>
                  ),
                  "step-review-submit": () => (
                    <form.Subscribe
                      selector={(state) => ({
                        canSubmit: state.canSubmit,
                        isSubmitting: state.isSubmitting,
                      })}
                    >
                      {({ canSubmit, isSubmitting }) => (
                        <Button
                          className="gap-4"
                          disabled={!canSubmit || isSubmitting || isLoading}
                          type="submit"
                        >
                          {isLoading || isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </>
                          ) : (
                            <>Create Agent</>
                          )}
                        </Button>
                      )}
                    </form.Subscribe>
                  ),
                })}
              </div>
            </Stepper.Controls>
          </form>
        </>
      )}
    </Stepper.Provider>
  );
}
