// AgentCards component for agent grid rendering
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Edit, Plus, Settings } from "lucide-react";
import React from "react";
import { CreateNewAgentButton } from "./create-new-agent-button";
// Adjust import if Agent type is elsewhere
import type { Agent } from "@/types";

type AgentCardsProps = {
  agents: Array<Agent>;
  selected: Set<string>;
  toggle: (id: string) => void;
};

export function AgentCards({ agents, selected, toggle }: AgentCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {agents?.map((agent) => (
        <div
          className="bg-white rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-xl flex flex-col space-y-4"
          key={agent.id}
        >
          <div className="flex flex-col space-y-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {agent.name}
              </h3>
              <Badge variant={agent.isActive ? "default" : "secondary"}>
                {agent.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-500">Project</p>
                <p className="text-sm font-medium text-gray-900">
                  {agent.project?.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Voice & Audience</p>
                <p className="text-sm font-medium text-gray-900">
                  {agent.voiceTone} • {agent.targetAudience}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Topics</p>
                <div className="flex flex-wrap gap-1">
                  {agent.topics?.slice(0, 2).map((topic: string) => (
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
              <div className="flex justify-between text-xs">
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
            {/* Action row with checkbox */}
            <div className="flex gap-2 mt-2 items-center">
              <input
                type="checkbox"
                checked={selected.has(agent.id)}
                onChange={() => toggle(agent.id)}
                className="accent-primary w-4 h-4 rounded border-gray-300"
                aria-label={`Select agent ${agent.name}`}
              />
              <Link search={{ agentId: agent.id }} to="/content/generate">
                <Button
                  className="flex-1 gap-4 rounded-2xl shadow-lg transition-all duration-300"
                  size="sm"
                  variant="outline"
                >
                  Generate
                </Button>
              </Link>
              <Link search={{ id: agent.id }} to="/agents/edit">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-2xl"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-2xl"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <CreateNewAgentButton />
    </div>
  );
}