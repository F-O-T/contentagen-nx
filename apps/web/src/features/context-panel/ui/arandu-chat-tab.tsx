import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useParams } from "@tanstack/react-router";
import { useId } from "react";

export function AranduChatTab() {
   const { teamId } = useParams({ strict: false });
   const threadId = useId();

   const runtime = useChatRuntime({
      transport: new AssistantChatTransport({
         api: "/api/chat",
         body: { teamId, threadId },
      }),
   });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <Thread />
      </AssistantRuntimeProvider>
   );
}
