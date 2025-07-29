import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTRPC } from "@/integrations/clients";

export function AgentDetailsKnowledgeChunksCard() {
  const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
  const trpc = useTRPC();
  const [viewedChunk, setViewedChunk] = useState<string | null>(null);

  const { data, isLoading, error } = useSuspenseQuery(
    trpc.agentKnowledge.listByAgentId.queryOptions({ agentId }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Chunks</CardTitle>
        <CardDescription>All knowledge chunks for this agent</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading knowledge chunks...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">
            Error loading knowledge chunks.
          </div>
        ) : !data?.metadatas?.length ? (
          <div className="py-8 text-center text-muted-foreground">
            No knowledge chunks found for this agent.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.metadatas.map((meta, idx) => (
              <div
                key={meta.agentId + idx}
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-lg p-6 flex flex-col justify-between border border-gray-100 hover:shadow-2xl transition-shadow duration-200 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                      {meta.sourceType}
                    </span>
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-700">
                      Agent: {meta.agentId?.slice(0, 8) ?? "-"}...
                    </span>
                  </div>
                  <p className="text-gray-800 text-base leading-relaxed mb-4">
                    {meta.summary?.length > 220
                      ? meta.summary.slice(0, 220) + "..."
                      : meta.summary}
                  </p>
                  {data.documents?.[idx] && (
                    <p className="text-sm text-gray-500 mb-2">
                      {data.documents[idx].length > 120
                        ? data.documents[idx].slice(0, 120) + "..."
                        : data.documents[idx]}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-xs text-gray-400">Knowledge Chunk</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>{" "}
    </Card>
  );
}
