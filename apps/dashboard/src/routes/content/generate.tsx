import { CreateContentForm } from "@/pages/content/ui/form";
import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useId, useState } from "react";

export const Route = createFileRoute("/content/generate")({
  component: GenerateContent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      agentId: String(search.agentId) || undefined,
    };
  },
});

function GenerateContent() {
  const topicFieldId = useId();
  const briefDescriptionFieldId = useId();
  const targetLengthFieldId = useId();
  const urgencyFieldId = useId();
  const includeImagesFieldId = useId();

  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    briefDescription: "",
    includeImages: false,
    targetLength: "medium",
    topic: "",
    urgency: "normal",
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsGenerating(false);
    navigate({ search: { generated: true, id: 999 }, to: "/content/review" });
  };

  // Sample article for demonstration
  const sampleArticle = {
    excerpt:
      "Artificial intelligence is revolutionizing how we create, edit, and distribute content across digital platforms...",
    readTime: "6 min read",
    title: "The Rise of AI-Powered Content Creation",
    wordCount: 1500,
  };

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
