import { Button } from "@packages/ui/components/button";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/agents/edit")({
  component: EditAgent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: String(search.id),
    };
  },
});

function EditAgent() {
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/agents/edit" });

  // Mock data - in a real app, this would be fetched based on the ID
  const [formData, setFormData] = useState({
    audience: "Professionals",
    contentType: "Blog Posts",
    description:
      "Generates professional AI and technology news articles for tech enthusiasts.",
    formattingStyle: "Structured (H1, H2, bullets)",
    name: "AI News Agent",
    project: "Tech Blog",
    seoKeywords: ["artificial intelligence", "tech news", "innovation"],
    tone: "Professional",
    topics: ["AI", "Machine Learning", "Technology"],
  });

  const [currentTopic, setCurrentTopic] = useState("");
  const [currentKeyword, setCurrentKeyword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating agent:", formData);
    navigate({ to: "/agents" });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this agent? This action cannot be undone.",
      )
    ) {
      console.log("Deleting agent:", id);
      navigate({ to: "/agents" });
    }
  };

  const addTopic = () => {
    if (currentTopic.trim() && !formData.topics.includes(currentTopic.trim())) {
      setFormData({
        ...formData,
        topics: [...formData.topics, currentTopic.trim()],
      });
      setCurrentTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter((t) => t !== topic),
    });
  };

  const addKeyword = () => {
    if (
      currentKeyword.trim() &&
      !formData.seoKeywords.includes(currentKeyword.trim())
    ) {
      setFormData({
        ...formData,
        seoKeywords: [...formData.seoKeywords, currentKeyword.trim()],
      });
      setCurrentKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      seoKeywords: formData.seoKeywords.filter((k) => k !== keyword),
    });
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
                <span className="text-gray-500">/ Edit Agent</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={handleDelete} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Link to="/agents">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Agents
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
            <h2 className="text-2xl font-bold text-gray-900">Edit AI Agent</h2>
            <p className="text-gray-600">
              Update your AI agent configuration and preferences.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Basic Information
                </h3>
              </div>
              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Name
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      type="text"
                      value={formData.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onChange={(e) =>
                        setFormData({ ...formData, project: e.target.value })
                      }
                      type="text"
                      value={formData.project}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    value={formData.description}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Content Configuration
                </h3>
              </div>
              <div className="px-6 py-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Content Type
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      "Blog Posts",
                      "Social Media",
                      "Marketing Copy",
                      "Technical Docs",
                    ].map((type) => (
                      <button
                        className={`p-3 text-sm rounded-lg border-2 transition-all ${
                          formData.contentType === type
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        key={type}
                        onClick={() =>
                          setFormData({ ...formData, contentType: type })
                        }
                        type="button"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Voice Tone
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      "Professional",
                      "Conversational",
                      "Educational",
                      "Creative",
                    ].map((tone) => (
                      <button
                        className={`p-3 text-sm rounded-lg border-2 transition-all ${
                          formData.tone === tone
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        key={tone}
                        onClick={() => setFormData({ ...formData, tone })}
                        type="button"
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      "General Public",
                      "Professionals",
                      "Beginners",
                      "Customers",
                    ].map((audience) => (
                      <button
                        className={`p-3 text-sm rounded-lg border-2 transition-all ${
                          formData.audience === audience
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        key={audience}
                        onClick={() => setFormData({ ...formData, audience })}
                        type="button"
                      >
                        {audience}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Formatting Style
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      "Structured (H1, H2, bullets)",
                      "Narrative (flowing text)",
                      "List-based (numbered/bulleted)",
                    ].map((style) => (
                      <button
                        className={`p-3 text-sm rounded-lg border-2 transition-all text-left ${
                          formData.formattingStyle === style
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        key={style}
                        onClick={() =>
                          setFormData({ ...formData, formattingStyle: style })
                        }
                        type="button"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Topics & SEO
                </h3>
              </div>
              <div className="px-6 py-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Topics
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onChange={(e) => setCurrentTopic(e.target.value)}
                      placeholder="Add a topic..."
                      type="text"
                      value={currentTopic}
                    />
                    <Button onClick={addTopic} size="sm" type="button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.topics.map((topic) => (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                        key={topic}
                      >
                        {topic}
                        <button
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                          onClick={() => removeTopic(topic)}
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Keywords
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onChange={(e) => setCurrentKeyword(e.target.value)}
                      placeholder="Add a keyword..."
                      type="text"
                      value={currentKeyword}
                    />
                    <Button onClick={addKeyword} size="sm" type="button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.seoKeywords.map((keyword) => (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        key={keyword}
                      >
                        {keyword}
                        <button
                          className="ml-2 text-green-600 hover:text-green-800"
                          onClick={() => removeKeyword(keyword)}
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-between">
              <Link to="/agents">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Update Agent
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
