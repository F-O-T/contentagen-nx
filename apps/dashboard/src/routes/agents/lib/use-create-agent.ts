import { useAppForm } from "@packages/ui/components/form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";

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
      await createAgentMutation.mutateAsync({
        ...value,
        // Convert display names to enum values
        contentType: value.contentType,
        formattingStyle: value.formattingStyle,
        targetAudience: value.targetAudience,
        voiceTone: value.voiceTone,
      });
    },
    validators: {
      onChange: ({ value }) => {
        if (!value.name) {
          return "Agent name is required";
        }
        if (!value.contentType) {
          return "Content type is required";
        }
        if (!value.voiceTone) {
          return "Voice tone is required";
        }
        if (!value.targetAudience) {
          return "Target audience is required";
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
