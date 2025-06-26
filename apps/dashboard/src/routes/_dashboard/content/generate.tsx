import { CreateContentForm } from "@/pages/content/ui/form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/content/generate")({
  component: GenerateContent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      agentId: String(search.agentId) || undefined,
    };
  },
});

function GenerateContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CreateContentForm />
    </div>
  );
}
