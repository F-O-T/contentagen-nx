import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Wand2 } from "lucide-react";
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
              <Link to="/">
                <h1 className="text-xl font-bold text-gray-900">BlogAI</h1>
              </Link>
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
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Sparkles className="h-8 w-8 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Generate New Content
              </h2>
            </div>
            <p className="text-gray-600">
              Provide a brief description and let AI create engaging content for
              you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Content Brief
                </h3>
                <form className="space-y-4" onSubmit={handleGenerate}>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor={topicFieldId}
                    >
                      Topic or Title
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      id={topicFieldId}
                      onChange={(e) =>
                        setFormData({ ...formData, topic: e.target.value })
                      }
                      placeholder="e.g., The Future of AI in Web Development"
                      required
                      type="text"
                      value={formData.topic}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor={briefDescriptionFieldId}
                    >
                      Brief Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      id={briefDescriptionFieldId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          briefDescription: e.target.value,
                        })
                      }
                      placeholder="Describe what you want the article to cover, key points to include, and any specific requirements..."
                      required
                      rows={4}
                      value={formData.briefDescription}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor={targetLengthFieldId}
                    >
                      Target Length
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      id={targetLengthFieldId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetLength: e.target.value,
                        })
                      }
                      value={formData.targetLength}
                    >
                      <option value="short">Short (500-800 words)</option>
                      <option value="medium">Medium (800-1500 words)</option>
                      <option value="long">Long (1500+ words)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor={urgencyFieldId}
                    >
                      Priority
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      id={urgencyFieldId}
                      onChange={(e) =>
                        setFormData({ ...formData, urgency: e.target.value })
                      }
                      value={formData.urgency}
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      checked={formData.includeImages}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      id={includeImagesFieldId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          includeImages: e.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    <label
                      className="ml-2 block text-sm text-gray-900"
                      htmlFor={includeImagesFieldId}
                    >
                      Include image suggestions
                    </label>
                  </div>

                  <Button
                    className="w-full"
                    disabled={isGenerating}
                    type="submit"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Draft
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* Sample Article Preview */}
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Sample Article
                </h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {sampleArticle.title}
                    </h4>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <span>{sampleArticle.wordCount} words</span>
                      <span className="mx-2">•</span>
                      <span>{sampleArticle.readTime}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 leading-relaxed">
                    {sampleArticle.excerpt}
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Article Structure:
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Introduction with hook</li>
                      <li>• Current state of AI in content</li>
                      <li>• Benefits and challenges</li>
                      <li>• Future predictions</li>
                      <li>• Conclusion and call-to-action</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-6">
                <h4 className="font-semibold text-indigo-900 mb-2">
                  💡 Pro Tips
                </h4>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• Be specific in your brief description</li>
                  <li>• Include target keywords naturally</li>
                  <li>• Specify your audience level</li>
                  <li>• Mention any required sections</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
