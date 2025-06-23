import { useAppForm } from "@packages/ui/components/form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { z } from "zod";

interface AgentFormData {
  name: string;
  description: string;
  project?: string;
  contentType:
    | "blog_posts"
    | "social_media"
    | "marketing_copy"
    | "technical_docs";
  voiceTone: "professional" | "conversational" | "educational" | "creative";
  targetAudience:
    | "general_public"
    | "professionals"
    | "beginners"
    | "customers";
  formattingStyle?: "structured" | "narrative" | "list_based";
  topics: string[];
  seoKeywords: string[];
}

const agentFormSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  description: z.string(),
  project: z.string().optional(),
  contentType: z.enum([
    "blog_posts",
    "social_media",
    "marketing_copy",
    "technical_docs",
  ], { required_error: "Content type is required" }),
  voiceTone: z.enum([
    "professional",
    "conversational",
    "educational",
    "creative",
  ], { required_error: "Voice tone is required" }),
  targetAudience: z.enum([
    "general_public",
    "professionals",
    "beginners",
    "customers",
  ], { required_error: "Target audience is required" }),
  formattingStyle: z.enum([
    "structured",
    "narrative",
    "list_based",
  ]).optional(),
  topics: z.array(z.string()),
  seoKeywords: z.array(z.string()),
});

export function useCreateAgent() {
  const navigate = useNavigate();
  const { eden } = useRouteContext({ from: "/agents/create" });

  const createAgentMutation = useMutation({
    mutationFn: eden.agents.post,
    onSuccess: () => {
      navigate({ to: "/agents" });
    },
  });

  const form = useAppForm({
    defaultValues: {
      contentType: "blog_posts",
      description: "",
      formattingStyle: "structured",
      name: "",
      project: "",
      seoKeywords: [] as string[],
      targetAudience: "general_public",
      topics: [] as string[],
      voiceTone: "professional",
    } as AgentFormData,
    onSubmit: async ({ value }) => {
      const result = agentFormSchema.safeParse(value);
      if (!result.success) {
        const firstError = Object.values(result.error.flatten().fieldErrors)
          .flat()
          .find(Boolean);
        return firstError || "Invalid form data";
      }
      await createAgentMutation.mutateAsync({
        ...result.data,
        contentType: result.data.contentType,
        formattingStyle: result.data.formattingStyle,
        targetAudience: result.data.targetAudience,
        voiceTone: result.data.voiceTone,
      });
    },
    validators: {
      onChange: ({ value }) => {
        const result = agentFormSchema.safeParse(value);
        if (!result.success) {

          const firstError = Object.values(result.error.flatten().fieldErrors)
            .flat()
            .find(Boolean);
          return firstError;
        }
        return undefined;
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return {
    form,
    handleSubmit,
    isLoading: createAgentMutation.isPending,
  };
}
