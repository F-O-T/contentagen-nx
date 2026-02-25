import { Thread } from "@/components/assistant-ui/thread";
import { useActiveTeam } from "@/hooks/use-active-team";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useId } from "react";

export function AranduChatTab() {
   const { activeTeamId } = useActiveTeam();
   const threadId = useId();

   const runtime = useChatRuntime({
      transport: new AssistantChatTransport({
         api: "/api/chat",
         body: { teamId: activeTeamId, threadId },
      }),
   });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <Thread />
      </AssistantRuntimeProvider>
   );
}
