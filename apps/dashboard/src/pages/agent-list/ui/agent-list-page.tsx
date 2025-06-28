import { createQueryKey } from "@packages/eden";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { Edit, Plus, Settings } from "lucide-react";

export function AgentListPage() {
   const { eden } = useRouteContext({ from: "/_dashboard/agents/" });
   const { data: agents } = useSuspenseQuery({
      queryFn: () => eden.api.v1.agents.get(),
      queryKey: createQueryKey("agents"),
      select: (data) => data.data,
   });

   return (
      <main className="h-full w-full flex flex-col space-y-8">
         <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
               <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
               <p className="text-sm text-gray-600">
                  Manage your AI content agents and their configurations
               </p>
            </div>
            <Link to="/agents/choice">
               <Button className="shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center rounded-2xl px-4 py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  New Agent
               </Button>
            </Link>
         </div>
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents?.agents?.map((agent) => (
               <div
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-xl flex flex-col space-y-4"
                  key={agent.id}
               >
                  <div className="flex flex-col space-y-4 p-6">
                     <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                           {agent.name}
                        </h3>
                        <Badge
                           variant={agent.isActive ? "default" : "secondary"}
                        >
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
                           <p className="text-xs text-gray-500">
                              Voice & Audience
                           </p>
                           <p className="text-sm font-medium text-gray-900">
                              {agent.voiceTone} • {agent.targetAudience}
                           </p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-500">Topics</p>
                           <div className="flex flex-wrap gap-1">
                              {agent.topics?.slice(0, 2).map((topic) => (
                                 <span
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                    key={topic}
                                 >
                                    {topic}
                                 </span>
                              ))}
                              {agent.topics?.length &&
                                 agent.topics.length > 2 && (
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
                     <div className="flex gap-2 mt-2">
                        <Link
                           search={{ agentId: agent.id }}
                           to="/content/generate"
                        >
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
            <Link to="/agents/choice">
               <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <Plus className="w-12 h-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-gray-900">
                     Create New Agent
                  </h3>
                  <p className="text-sm text-gray-500 text-center">
                     Set up a new AI agent with custom voice and topics
                  </p>
               </div>
            </Link>
         </div>
      </main>
   );
}
