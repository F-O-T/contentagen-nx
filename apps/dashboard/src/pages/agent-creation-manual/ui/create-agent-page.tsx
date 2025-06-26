import { driver } from "driver.js";
import { useRef } from "react";
import "driver.js/dist/driver.css";
import { Button } from "@packages/ui/components/button";
import { defineStepper } from "@packages/ui/components/stepper";
import mascot from "/logo192.png";
import { useAgentForm } from "../lib/use-agent-form";
import { BasicInfoStep } from "./basic-info-step";
import { ContentConfigStep } from "./content-config-step";
import { ReviewSubmitStep } from "./review-submit-step";
import { TopicsSeoStep } from "./topics-seo-step";

const STEPPER_STEPS = [
  {
    description: "Enter your agent's name and description",
    id: "step-basic-info",
    title: "Basic Info",
  },
  {
    description: "Configure content type, voice, and audience",
    id: "step-content-config",
    title: "Content Config",
  },
  {
    description: "Add topics and SEO keywords",
    id: "step-topics-seo",
    title: "Topics & SEO",
  },
  {
    description: "Review and create your agent",
    id: "step-review-submit",
    title: "Review & Submit",
  },
];

const TOUR_STEPS = [
  {
    element: "#step-basic-info",
    popover: {
      align: "start" as const,
      description: `<img src="${mascot}" alt="Mascot" style="height:32px;vertical-align:middle;margin-right:8px;"/>Enter your agent's name, project, and a short description to get started.`,
      side: "bottom" as const,
      title: "Step 1: Basic Information",
    },
  },
  {
    element: "#step-content-config",
    popover: {
      align: "start" as const,
      description: `<img src="${mascot}" alt="Mascot" style="height:32px;vertical-align:middle;margin-right:8px;"/>Choose your content type, voice tone, target audience, and formatting style.`,
      side: "bottom" as const,
      title: "Step 2: Content Configuration",
    },
  },
  {
    element: "#step-topics-seo",
    popover: {
      align: "start" as const,
      description: `<img src="${mascot}" alt="Mascot" style="height:32px;vertical-align:middle;margin-right:8px;"/>Add relevant topics and SEO keywords to help your agent create better content.`,
      side: "bottom" as const,
      title: "Step 3: Topics & SEO",
    },
  },
  {
    element: "#step-review-submit",
    popover: {
      align: "start" as const,
      description: `<img src="${mascot}" alt="Mascot" style="height:32px;vertical-align:middle;margin-right:8px;"/>Review all your settings and create your new content agent.`,
      side: "bottom" as const,
      title: "Step 4: Review & Submit",
    },
  },
];

const { Stepper } = defineStepper(...STEPPER_STEPS);

export function CreateAgentPage() {
  const { form, handleSubmit, isLoading } = useAgentForm();

  const driverInstance = useRef(
    driver({
      allowClose: true,
      doneBtnText: "Finish Tour",
      nextBtnText: "Next",
      overlayClickNext: false,
      prevBtnText: "Back",
      showProgress: true,
      steps: TOUR_STEPS,
    }),
  );

  const startGuidedTour = () => {
    driverInstance.current.drive();
  };

  const validateCurrentStep = async (stepId: string): Promise<boolean> => {
    switch (stepId) {
      case "step-basic-info": {
        const name = form.getFieldValue("name");
        return !!name && name.trim().length > 0;
      }
      case "step-content-config": {
        const contentType = form.getFieldValue("contentType");
        const voiceTone = form.getFieldValue("voiceTone");
        const targetAudience = form.getFieldValue("targetAudience");
        return !!(contentType && voiceTone && targetAudience);
      }
      case "step-topics-seo": {
        // Topics and SEO are optional, so always return true
        return true;
      }
      case "step-review-submit": {
        // Final validation will be handled by form submission
        return true;
      }
      default:
        return true;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Create New Content Agent
        </h1>
        <p className="text-muted-foreground mb-6">
          Set up your AI content agent by following these simple steps. Your
          agent will help you generate consistent, high-quality content.
        </p>
        <Button
          className="mb-6"
          onClick={startGuidedTour}
          size="sm"
          variant="outline"
        >
          🎯 Start Guided Tour
        </Button>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <Stepper.Provider className="space-y-8">
          {({ methods }) => (
            <>
              <Stepper.Navigation className="flex justify-center">
                {methods.all.map((step) => (
                  <Stepper.Step
                    className="cursor-pointer"
                    key={step.id}
                    of={step.id}
                    onClick={() => methods.goTo(step.id)}
                  >
                    <Stepper.Title className="text-sm font-medium">
                      {step.title}
                    </Stepper.Title>
                    <Stepper.Description className="text-xs text-muted-foreground">
                      {step.description}
                    </Stepper.Description>
                  </Stepper.Step>
                ))}
              </Stepper.Navigation>

              <div className="min-h-[400px]">
                {methods.switch({
                  "step-basic-info": () => (
                    <Stepper.Panel
                      className="space-y-6 p-6 bg-card rounded-lg border"
                      id="step-basic-info"
                    >
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">
                          Basic Information
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Provide basic details about your content agent
                        </p>
                      </div>
                      <BasicInfoStep />
                    </Stepper.Panel>
                  ),
                  "step-content-config": () => (
                    <Stepper.Panel
                      className="space-y-6 p-6 bg-card rounded-lg border"
                      id="step-content-config"
                    >
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">
                          Content Configuration
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Configure how your agent will create content
                        </p>
                      </div>
                      <ContentConfigStep />
                    </Stepper.Panel>
                  ),
                  "step-review-submit": () => (
                    <Stepper.Panel
                      className="space-y-6 p-6 bg-card rounded-lg border"
                      id="step-review-submit"
                    >
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">
                          Review & Submit
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Review your agent configuration and create it
                        </p>
                      </div>
                      <ReviewSubmitStep />
                    </Stepper.Panel>
                  ),
                  "step-topics-seo": () => (
                    <Stepper.Panel
                      className="space-y-6 p-6 bg-card rounded-lg border"
                      id="step-topics-seo"
                    >
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Topics & SEO</h2>
                        <p className="text-sm text-muted-foreground">
                          Add topics and keywords to guide content creation
                        </p>
                      </div>
                      <TopicsSeoStep />
                    </Stepper.Panel>
                  ),
                })}
              </div>

              <Stepper.Controls className="flex justify-between items-center pt-6 border-t">
                <div>
                  {!methods.isFirst && (
                    <Button
                      disabled={methods.isFirst}
                      onClick={methods.prev}
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex gap-3">
                  {!methods.isLast && (
                    <Button
                      onClick={async () => {
                        const isValid = await validateCurrentStep(
                          methods.currentStep,
                        );
                        if (isValid) {
                          methods.next();
                        }
                      }}
                      type="button"
                    >
                      Next
                    </Button>
                  )}

                  {methods.isLast && (
                    <Button
                      className="min-w-[120px]"
                      disabled={isLoading}
                      type="submit"
                    >
                      {isLoading ? "Creating..." : "Create Agent"}
                    </Button>
                  )}
                </div>
              </Stepper.Controls>
            </>
          )}
        </Stepper.Provider>
      </form>
    </div>
  );
}
