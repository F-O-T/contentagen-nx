import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Button } from "@packages/ui/components/button";
import {
   createFileRoute,
   Link,
   Outlet,
   useParams,
} from "@tanstack/react-router";
import { MessageSquarePlusIcon } from "lucide-react";
import { useEffect } from "react";
import { closeContextPanel } from "@/features/context-panel/use-context-panel";
import { useTecoRuntime } from "@/features/teco-chat/hooks/use-teco-runtime";
import {
   resetChatContext,
   setChatMode,
} from "@/features/teco-chat/stores/chat-context-store";
import { ThreadList } from "@/features/teco-chat/ui/thread-list";
import { useActiveTeam } from "@/hooks/use-active-team";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/chat",
)({
   loader: () => { setChatMode("platform"); },
   onLeave: () => { resetChatContext(); },
   component: ChatLayoutPage,
});

function ChatLayoutContent({ teamId }: { teamId: string }) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const runtime = useTecoRuntime({ teamId });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <div className="flex h-full w-full overflow-hidden">
            <div className="hidden w-56 shrink-0 border-r border-border/60 bg-accent md:flex md:flex-col">
               <ThreadList
                  newThreadTrigger={
                     <Link
                        params={{ slug, teamSlug }}
                        to="/$slug/$teamSlug/chat"
                     >
                        <Button
                           className="flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                           variant="outline"
                        >
                           Nova conversa
                           <MessageSquarePlusIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
                        </Button>
                     </Link>
                  }
                  renderThreadTrigger={({ externalId, children }) => {
                     if (!externalId) {
                        return (
                           <button
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              type="button"
                           >
                              {children}
                           </button>
                        );
                     }
                     return (
                        <Link
                           className="flex min-w-0 flex-1 items-center gap-2 text-left"
                           params={{ slug, teamSlug, threadId: externalId }}
                           to="/$slug/$teamSlug/chat/$threadId"
                        >
                           {children}
                        </Link>
                     );
                  }}
                  welcomeIconUrl="/mascot.svg"
               />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden bg-background">
               <Outlet />
            </div>
         </div>
      </AssistantRuntimeProvider>
   );
}

function ChatLayoutPage() {
   const { activeTeamId } = useActiveTeam();

   useEffect(() => {
      closeContextPanel();
   }, []);

   if (!activeTeamId) return null;

   return <ChatLayoutContent teamId={activeTeamId} />;
}
