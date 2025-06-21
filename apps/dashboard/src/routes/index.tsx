import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Plus, Settings, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

// Mock data for the prototype
const mockProjects = [
  {
    agents: [
      {
        audience: "Tech enthusiasts",
        drafts: 3,
        id: 1,
        name: "AI News Agent",
        published: 12,
        status: "active",
        tone: "Professional",
      },
      {
        audience: "Developers",
        drafts: 1,
        id: 2,
        name: "Tutorial Agent",
        published: 5,
        status: "draft",
        tone: "Educational",
      },
    ],
    id: 1,
    name: "Tech Blog",
  },
  {
    agents: [
      {
        audience: "Customers",
        drafts: 2,
        id: 3,
        name: "Product Updates",
        published: 8,
        status: "active",
        tone: "Conversational",
      },
    ],
    id: 2,
    name: "Marketing Blog",
  },
];

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">BlogAI</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  to="/"
                >
                  Dashboard
                </Link>
                <Link
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
              <Link to="/onboarding">
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
            <h2 className="text-2xl font-bold text-gray-900">
              Project Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your AI content agents and track their performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Agents
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">3</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Drafts Ready
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">6</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Published This Month
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">25</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Projects
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">2</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-6">
            {mockProjects.map((project) => (
              <div className="bg-white shadow rounded-lg" key={project.id}>
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {project.name}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {project.agents.length} agent
                    {project.agents.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {project.agents.map((agent) => (
                        <div
                          className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
                          key={agent.id}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {agent.name}
                                </p>
                                <Badge
                                  variant={
                                    agent.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {agent.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {agent.tone} • {agent.audience}
                              </p>
                              <div className="mt-2 flex text-sm text-gray-500">
                                <span>{agent.drafts} drafts</span>
                                <span className="mx-2">•</span>
                                <span>{agent.published} published</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex space-x-2">
                            <Link
                              search={{ agentId: agent.id }}
                              to="/content/generate"
                            >
                              <Button size="sm" variant="outline">
                                Generate
                              </Button>
                            </Link>
                            <Link search={{ id: agent.id }} to="/agents/edit">
                              <Button size="sm" variant="ghost">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
