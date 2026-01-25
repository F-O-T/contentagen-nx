/**
 * Chat Store
 *
 * TanStack Store for managing the chat sidebar state.
 * Handles messages, streaming, and session management.
 */
import { Store, useStore } from "@tanstack/react-store";
import type { ChatMessage, ChatMessageRole, ChatState } from "../schemas";

const initialState: ChatState = {
   isOpen: false,
   messages: [],
   isStreaming: false,
   currentInput: "",
   sessionId: null,
   error: null,
};

const chatStore = new Store<ChatState>(initialState);

// ============================================================================
// Visibility Actions
// ============================================================================

/**
 * Open the chat sidebar
 */
export const openChat = () =>
   chatStore.setState((state) => ({
      ...state,
      isOpen: true,
   }));

/**
 * Close the chat sidebar
 */
export const closeChat = () =>
   chatStore.setState((state) => ({
      ...state,
      isOpen: false,
   }));

/**
 * Toggle the chat sidebar
 */
export const toggleChat = () =>
   chatStore.setState((state) => ({
      ...state,
      isOpen: !state.isOpen,
   }));

// ============================================================================
// Input Actions
// ============================================================================

/**
 * Set the current input text
 */
export const setChatInput = (input: string) =>
   chatStore.setState((state) => ({
      ...state,
      currentInput: input,
   }));

/**
 * Clear the current input
 */
export const clearChatInput = () =>
   chatStore.setState((state) => ({
      ...state,
      currentInput: "",
   }));

// ============================================================================
// Message Actions
// ============================================================================

/**
 * Add a message to the chat
 */
export const addChatMessage = (role: ChatMessageRole, content: string) =>
   chatStore.setState((state) => ({
      ...state,
      messages: [
         ...state.messages,
         {
            id: crypto.randomUUID(),
            role,
            content,
            createdAt: new Date(),
         },
      ],
   }));

/**
 * Update the last assistant message (for streaming)
 */
export const updateLastAssistantMessage = (content: string) =>
   chatStore.setState((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.findLastIndex(
         (m: ChatMessage) => m.role === "assistant",
      );
      if (lastIndex >= 0 && messages[lastIndex]) {
         const existing = messages[lastIndex];
         messages[lastIndex] = {
            id: existing.id,
            role: existing.role,
            createdAt: existing.createdAt,
            content,
         };
      }
      return { ...state, messages };
   });

/**
 * Append to the last assistant message (for streaming)
 */
export const appendToLastAssistantMessage = (chunk: string) =>
   chatStore.setState((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.findLastIndex(
         (m: ChatMessage) => m.role === "assistant",
      );
      if (lastIndex >= 0 && messages[lastIndex]) {
         const existing = messages[lastIndex];
         messages[lastIndex] = {
            id: existing.id,
            role: existing.role,
            createdAt: existing.createdAt,
            content: existing.content + chunk,
         };
      }
      return { ...state, messages };
   });

/**
 * Clear all messages
 */
export const clearChatMessages = () =>
   chatStore.setState((state) => ({
      ...state,
      messages: [],
   }));

/**
 * Set messages (for loading history)
 */
export const setChatMessages = (messages: ChatMessage[]) =>
   chatStore.setState((state) => ({
      ...state,
      messages,
   }));

// ============================================================================
// Streaming Actions
// ============================================================================

/**
 * Start streaming a response
 */
export const startChatStreaming = () =>
   chatStore.setState((state) => ({
      ...state,
      isStreaming: true,
      error: null,
   }));

/**
 * Stop streaming
 */
export const stopChatStreaming = () =>
   chatStore.setState((state) => ({
      ...state,
      isStreaming: false,
   }));

// ============================================================================
// Session Actions
// ============================================================================

/**
 * Set the session ID
 */
export const setChatSessionId = (sessionId: string | null) =>
   chatStore.setState((state) => ({
      ...state,
      sessionId,
   }));

/**
 * Start a new session
 */
export const startNewChatSession = () =>
   chatStore.setState((state) => ({
      ...state,
      sessionId: crypto.randomUUID(),
      messages: [],
      error: null,
   }));

// ============================================================================
// Error Actions
// ============================================================================

/**
 * Set error state
 */
export const setChatError = (error: Error | null) =>
   chatStore.setState((state) => ({
      ...state,
      error,
      isStreaming: false,
   }));

/**
 * Clear error
 */
export const clearChatError = () =>
   chatStore.setState((state) => ({
      ...state,
      error: null,
   }));

// ============================================================================
// Reset
// ============================================================================

/**
 * Reset chat to initial state
 */
export const resetChat = () =>
   chatStore.setState(() => ({
      ...initialState,
   }));

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access chat state and actions
 */
export const useChatContext = () => {
   const state = useStore(chatStore);

   return {
      ...state,
      openChat,
      closeChat,
      toggleChat,
      setChatInput,
      clearChatInput,
      addChatMessage,
      updateLastAssistantMessage,
      appendToLastAssistantMessage,
      clearChatMessages,
      setChatMessages,
      startChatStreaming,
      stopChatStreaming,
      setChatSessionId,
      startNewChatSession,
      setChatError,
      clearChatError,
      resetChat,
   };
};

/**
 * Hook to access just the chat state (for read-only consumers)
 */
export const useChatState = () => {
   return useStore(chatStore);
};

/**
 * Get current chat state synchronously (for use outside React)
 */
export const getChatState = () => chatStore.state;

/**
 * Subscribe to chat state changes
 */
export const subscribeChat = (listener: (state: ChatState) => void) => {
   return chatStore.subscribe(() => listener(chatStore.state));
};
