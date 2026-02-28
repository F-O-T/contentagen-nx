import type { ContentModelId } from "@packages/agents/models";
import { DEFAULT_CONTENT_MODEL_ID } from "@packages/agents/models";
import { Store } from "@tanstack/react-store";

export type ChatMode = "editor" | "content-list" | "analytics" | "forms" | "platform";

interface ChatContextState {
   mode: ChatMode;
   contextId: string | null;
   workflow: "content-creation" | null;
   model: ContentModelId;
   thinkingBudget: number;
}

const DEFAULT_STATE: ChatContextState = {
   mode: "platform",
   contextId: null,
   workflow: null,
   model: DEFAULT_CONTENT_MODEL_ID,
   thinkingBudget: 0,
};

export const chatContextStore = new Store<ChatContextState>(DEFAULT_STATE);

export function setChatMode(mode: ChatMode, contextId?: string | null) {
   chatContextStore.setState((s) => ({
      ...s,
      mode,
      contextId: contextId ?? null,
      workflow: null,
   }));
}

export function setChatModel(model: ContentModelId) {
   chatContextStore.setState((s) => ({ ...s, model }));
}

export function setChatThinkingBudget(thinkingBudget: number) {
   chatContextStore.setState((s) => ({ ...s, thinkingBudget }));
}

export function resetChatContext() {
   chatContextStore.setState(() => ({ ...DEFAULT_STATE }));
}
