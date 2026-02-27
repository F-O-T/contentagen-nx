import { Store } from "@tanstack/react-store";

interface ChatContextState {
   router: "auto" | "content";
   contextId: string | null;
   workflow: "content-creation" | null;
}

const DEFAULT_STATE: ChatContextState = {
   router: "auto",
   contextId: null,
   workflow: null,
};

export const chatContextStore = new Store<ChatContextState>(DEFAULT_STATE);

export function setChatContext(
   router: ChatContextState["router"],
   contextId: string | null,
   workflow?: ChatContextState["workflow"],
) {
   chatContextStore.setState(() => ({ router, contextId, workflow: workflow ?? null }));
}

export function resetChatContext() {
   chatContextStore.setState(() => ({ ...DEFAULT_STATE }));
}
