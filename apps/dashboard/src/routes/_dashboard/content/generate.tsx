import { CreateContentForm } from "@/pages/content/ui/form";
import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

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
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="ml-6">
                <span className="text-gray-500">/ Generate Content</span>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/content">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Content
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <CreateContentForm />
      </main>
    </div>
  );
}
