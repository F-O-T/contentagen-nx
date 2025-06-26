import type { FormApi } from "@/types";
import { Button } from "@packages/ui/components/button";
import { useAppForm } from "@packages/ui/components/form";
import { Progress } from "@packages/ui/components/progress";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bot } from "lucide-react";
import { useCallback, useState } from "react";
import { z } from "zod";
import { ArticleExample } from "./article-example";
import { ConfigureAgent } from "./configure-agent";
import { TemplateSelection } from "./template-selection";
import { WriteInstructions } from "./write-instructions";

const ContentFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  basePrompt: z.string().min(1, "Base prompt é obrigatório"),
  exampleArticle: z.string().min(1, "Example article é obrigatório"),
  seoFocus: z.boolean(),
  targetAudience: z.enum([
    "general_public",
    "professionals",
    "beginners",
    "customers",
  ]),
  tone: z.enum(["professional", "conversational", "educational", "creative"]),
  wordCount: z.number().min(1, "Word count é obrigatório"),
});

export const TemplateSelectionFormSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  name: z.string().min(1, "Name is required"),
});

export const ConfigureAgentFormSchema = z.object({
  targetAudience: z.enum([
    "general_public",
    "professionals",
    "beginners",
    "customers",
  ]),
  tone: z.enum(["professional", "conversational", "educational", "creative"]),
  wordCount: z.number().min(1, "Word count is required"),
  seoFocus: z.boolean(),
});

export const WriteInstructionsFormSchema = z.object({
  basePrompt: z.string().min(1, "Base prompt is required"),
});

export const ArticleExampleFormSchema = z.object({
  exampleArticle: z.string().min(1, "Example article is required"),
});

export type ContentFormData = z.infer<typeof ContentFormSchema>;
export type TemplateSelectionFormData = z.infer<
  typeof TemplateSelectionFormSchema
>;
export type ConfigureAgentFormData = z.infer<typeof ConfigureAgentFormSchema>;
export type WriteInstructionsFormData = z.infer<
  typeof WriteInstructionsFormSchema
>;
export type ArticleExampleFormData = z.infer<typeof ArticleExampleFormSchema>;

export function CreateContentForm() {
  const { eden } = useRouteContext({ from: "/content/generate" });

  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const { mutate: createContent } = useMutation({
    mutationFn: (values: z.infer<typeof ContentFormSchema>) =>
      eden.api.v1.agents.post({
        name: values.name,
        basePrompt: values.basePrompt,
        exampleArticle: values.exampleArticle,
        contentType: "blog_posts",
        targetAudience: values.targetAudience,
        voiceTone: values.tone,
        seoFocus: values.seoFocus,
        wordCount: values.wordCount,
        topics: [],
      }),
    onSuccess: (data) => {
      console.log("Agent created successfully:", data);
    },
  });

  const handleSubmit = useCallback(
    async (values: z.infer<typeof ContentFormSchema>) => {
      console.log(values);
      createContent(values);
    },
    [createContent],
  );

  const templateSelectionForm = useAppForm({
    defaultValues: {
      name: "",
      templateId: "",
    },
    validators: {
      onBlur: TemplateSelectionFormSchema,
    },
  });

  const configureAgentForm = useAppForm({
    defaultValues: {
      targetAudience: "general_public" as any,
      tone: "professional" as any,
      wordCount: 1000,
      seoFocus: false,
    },
    validators: {
      onBlur: ConfigureAgentFormSchema,
    },
  });

  const writeInstructionsForm = useAppForm({
    defaultValues: {
      basePrompt: "",
    },
    validators: {
      onBlur: WriteInstructionsFormSchema,
    },
  });

  const articleExampleForm = useAppForm({
    defaultValues: {
      exampleArticle: "",
    },
    validators: {
      onBlur: ArticleExampleFormSchema,
    },
  });

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        try {
          TemplateSelectionFormSchema.parse(templateSelectionForm.state.values);
          return true;
        } catch {
          return false;
        }
      case 2:
        try {
          ConfigureAgentFormSchema.parse(configureAgentForm.state.values);
          return true;
        } catch {
          return false;
        }
      case 3:
        try {
          WriteInstructionsFormSchema.parse(writeInstructionsForm.state.values);
          return true;
        } catch {
          return false;
        }
      case 4:
        try {
          ArticleExampleFormSchema.parse(articleExampleForm.state.values);
          return true;
        } catch {
          return false;
        }
      default:
        return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all forms before submission
    try {
      TemplateSelectionFormSchema.parse(templateSelectionForm.state.values);
      ConfigureAgentFormSchema.parse(configureAgentForm.state.values);

      // Combine all form values
      const allValues = {
        ...templateSelectionForm.state.values,
        ...configureAgentForm.state.values,
        ...writeInstructionsForm.state.values,
        ...articleExampleForm.state.values,
      };

      await handleSubmit(allValues);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return templateSelectionForm.state.isValid;
      case 2:
        return configureAgentForm.state.isValid;
      case 3:
        return writeInstructionsForm.state.isValid;
      case 4:
        return articleExampleForm.state.isValid;
      default:
        return false;
    }
  };

  return (
    <div>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                Create New AI Agent
              </h1>
              <p className="text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
          <Progress className="h-2" value={progress} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form className="space-y-4" onSubmit={handleFinalSubmit}>
          {currentStep === 1 && (
            <TemplateSelection
              form={templateSelectionForm as FormApi<TemplateSelectionFormData>}
            />
          )}

          {currentStep === 2 && (
            <ConfigureAgent
              form={configureAgentForm as FormApi<ConfigureAgentFormData>}
            />
          )}

          {currentStep === 3 && (
            <WriteInstructions
              form={writeInstructionsForm as FormApi<WriteInstructionsFormData>}
            />
          )}

          {currentStep === 4 && (
            <ArticleExample
              form={articleExampleForm as FormApi<ArticleExampleFormData>}
            />
          )}

          <div className="flex justify-between items-center mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={!isStepValid()}>
                <Bot className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
