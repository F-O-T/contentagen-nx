import { createQueryKey } from "@packages/eden";

import { useSuspenseQuery } from "@tanstack/react-query";
import {  useRouteContext } from "@tanstack/react-router";

import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import React from "react";
import { AgentCards } from "./agent-cards";

export function AgentListPage() {
   const { eden } = useRouteContext({ from: "/_dashboard/agents/" });
   const { data: agents } = useSuspenseQuery({
      queryFn: () => eden.api.v1.agents.get(),
      queryKey: createQueryKey("agents"),
      select: (data) => data.data,
   });

   // Selection state for agent IDs
   const [selected, setSelected] = React.useState<Set<string>>(new Set());

   // Handler for toggling agent selection
   const toggleSelected = (id: string) => {
      setSelected((prev) => {
         const next = new Set(prev);
         if (next.has(id)) {
            next.delete(id);
         } else {
            next.add(id);
         }
         return next;
      });
   };

   // Handler for "Delete Selected"
   const handleDeleteSelected = () => {
      console.log(Array.from(selected));
   };

   return (
      <main className="h-full w-full flex flex-col space-y-8">
         {/* Section 1: Mascot */}
         <div>
            <TalkingMascot message="Here you can manage all your AI agents. Create, edit, or explore your team below!" />
         </div>
       
      
         <AgentCards
           agents={agents?.agents ?? []}
           selected={selected}
           toggle={toggleSelected}
         />
      </main>
   );
}
