import { createQueryKey } from "@packages/eden";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { Edit, Plus, Settings } from "lucide-react";

export const Route = createFileRoute("/agents/")({
  component: Agents,
});

function Agents() {
  const { eden } = useRouteContext({ from: "/agents/" });
  const { data: agents } = useQuery({
    queryFn: () => eden.agents.get(),
    queryKey: createQueryKey("agents"),
    select: (data) => data.data,
  });

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="mx-auto sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your AI content agents and their configurations
              </p>
            </div>

            <Link to="/agents/create">
              <Button className="ml-3">
                <Plus className="w-4 h-4 mr-2" />
                New Agent
              </Button>
            </Link>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents?.map((agent) => (
              <div
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                key={agent.id}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {agent.name}
                    </h3>
                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Project</p>
                      <p className="text-sm font-medium text-gray-900">
                        {agent.project?.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Voice & Audience</p>
                      <p className="text-sm font-medium text-gray-900">
                        {agent.voiceTone} • {agent.targetAudience}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Topics</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.topics?.slice(0, 2).map((topic) => (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            key={topic}
                          >
                            {topic}
                          </span>
                        ))}
                        {agent.topics?.length && agent.topics.length > 2 && (
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
                          {agent.totalDrafts}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Published</p>
                        <p className="font-medium text-gray-900">
                          {agent.totalPublished}
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
              <div className="bg-card border-2 border-dashed border-border rounded-lg p-6 hover:border-accent transition-colors cursor-pointer h-full flex flex-col items-center justify-center hover:bg-accent/5">
                <Plus className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Create New Agent
                </h3>
                <p className="text-sm text-muted-foreground text-center">
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
