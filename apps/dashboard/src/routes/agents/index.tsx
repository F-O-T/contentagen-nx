import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, Plus, Settings } from "lucide-react";

export const Route = createFileRoute("/agents/")({
  component: Agents,
});

// Mock data for agents
const mockAgents = [
  {
    audience: "Tech enthusiasts",
    drafts: 3,
    id: 1,
    lastGenerated: "2024-01-15",
    name: "AI News Agent",
    project: "Tech Blog",
    published: 12,
    seoKeywords: ["artificial intelligence", "tech news", "innovation"],
    status: "active",
    tone: "Professional",
    topics: ["AI", "Machine Learning", "Technology"],
  },
  {
    audience: "Developers",
    drafts: 1,
    id: 2,
    lastGenerated: "2024-01-14",
    name: "Tutorial Agent",
    project: "Tech Blog",
    published: 5,
    seoKeywords: ["coding", "programming", "development"],
    status: "draft",
    tone: "Educational",
    topics: ["Programming", "Web Development", "Tutorials"],
  },
  {
    audience: "Customers",
    drafts: 2,
    id: 3,
    lastGenerated: "2024-01-16",
    name: "Product Updates",
    project: "Marketing Blog",
    published: 8,
    seoKeywords: ["product", "updates", "features"],
    status: "active",
    tone: "Conversational",
    topics: ["Product Updates", "Features", "Announcements"],
  },
];

function Agents() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/">
                  <h1 className="text-xl font-bold text-gray-900">BlogAI</h1>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  to="/"
                >
                  Dashboard
                </Link>
                <Link
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  to="/agents"
                >
                  Agents
                </Link>
                <Link
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  to="/content"
                >
                  Content
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/agents/create">
                <Button className="ml-3">
                  <Plus className="w-4 h-4 mr-2" />
                  New Agent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your AI content agents and their configurations
            </p>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockAgents.map((agent) => (
              <div
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                key={agent.id}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {agent.name}
                    </h3>
                    <Badge
                      variant={
                        agent.status === "active" ? "default" : "secondary"
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Project</p>
                      <p className="text-sm font-medium text-gray-900">
                        {agent.project}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Voice & Audience</p>
                      <p className="text-sm font-medium text-gray-900">
                        {agent.tone} • {agent.audience}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Topics</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.topics.slice(0, 2).map((topic) => (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            key={topic}
                          >
                            {topic}
                          </span>
                        ))}
                        {agent.topics.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{agent.topics.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-500">Drafts</p>
                        <p className="font-medium text-gray-900">
                          {agent.drafts}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Published</p>
                        <p className="font-medium text-gray-900">
                          {agent.published}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-2">
                    <Link search={{ agentId: agent.id }} to="/content/generate">
                      <Button className="flex-1" size="sm" variant="outline">
                        Generate
                      </Button>
                    </Link>
                    <Link search={{ id: agent.id }} to="/agents/edit">
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Agent Card */}
            <Link to="/agents/create">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer h-full flex flex-col items-center justify-center">
                <Plus className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Create New Agent
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  Set up a new AI agent with custom voice and topics
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
