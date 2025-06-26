import mascot from "@packages/brand/logo.svg";
import { Button } from "@packages/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { HelpCircle } from "lucide-react";
import {
  useAgentFormContext,
  type AgentFormStep,
} from "../lib/agent-form-context.tsx";
import { useDriverTour } from "../lib/use-driver-tour";

interface ProgressStepCardProps {
  currentStep: AgentFormStep;
  totalSteps: number;
  currentStepIndex: number;
  onStepChange: (stepId: AgentFormStep) => void;
  onStartMainTour: () => void;
  onStartStepTour: (stepId: AgentFormStep) => void;
}

export function ProgressStepCard({
  currentStep,
  totalSteps,
  currentStepIndex,
  onStepChange,
  onStartMainTour,
  onStartStepTour,
}: ProgressStepCardProps) {
  const { StepperProvider, Stepper } = useAgentFormContext();
  const { startMainTour, startStepTour, getMascotMessage } = useDriverTour();

  const handleMainTour = () => {
    startMainTour();
    onStartMainTour();
  };

  const handleStepTour = (stepId: AgentFormStep) => {
    startStepTour(stepId);
    onStartStepTour(stepId);
  };

  return (
    <StepperProvider>
      {({ methods }) => (
        <Card id="progress-stepper" className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-start gap-4">
                {methods.all.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div className="flex flex-col items-center" key={step.id}>
                      <Stepper.Step
                        className="cursor-pointer group"
                        of={step.id}
                        onClick={() => onStepChange(step.id as AgentFormStep)}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 hover:scale-110 transform ${
                            isCompleted || isCurrent
                              ? "bg-slate-800 text-white shadow-lg ring-4 ring-slate-200"
                              : "bg-slate-300 text-slate-600 hover:bg-slate-400 hover:shadow-md"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </Stepper.Step>
                    </div>
                  );
                })}
              </div>
            </CardTitle>
            <CardDescription>
              <div className="flex-1">
                <Progress
                  value={((currentStepIndex + 1) / totalSteps) * 100}
                  className="w-full h-2"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-600">
                  <span>Step {currentStepIndex + 1}</span>
                  <span>{totalSteps} steps</span>
                </div>
              </div>
            </CardDescription>
            <CardAction>
              <Button
                className="ml-4 text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                onClick={handleMainTour}
                size="icon"
                title="Help - How to use"
                type="button"
                variant="ghost"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </CardAction>
          </CardHeader>

          {/* Steps Content */}
          <CardContent>
            <div className="flex items-start gap-6 w-full" id="mascot-speech">
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    alt="Content Agent Mascot"
                    className="w-12 h-12 rounded-full shadow-lg border-4 border-white"
                    src={mascot}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl px-6 py-4 relative flex-1 shadow-lg border border-slate-200 transition-all duration-300 ease-in-out">
                <div className="absolute left-[-8px] top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-white"></div>
                <p className="text-slate-800 font-medium leading-relaxed transition-all duration-300">
                  {getMascotMessage(currentStep)}
                </p>
                {/* Step Tour Button */}
                <Button
                  className="mt-2 h-auto text-xs text-slate-600 hover:bg-slate-50 px-2 py-1 transition-colors duration-200 rounded-full"
                  onClick={() => handleStepTour(currentStep)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  💡 See tip for this step
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </StepperProvider>
  );
}
