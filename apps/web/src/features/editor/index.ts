/**
 * Editor feature (apps/web)
 *
 * AI-powered content editor built on Lexical.
 * Provides FIM (Fill-in-Middle), inline editing (Ctrl+K), and chat features.
 */

export {
   createEditorConfig,
   createEditorFeatures,
   createFIMConfig,
   defaultEditorConfig,
   defaultEditorFeatures,
   defaultFIMConfig,
   diagnosticsConfig,
   fimContextConfig,
   spellCheckIgnoreList,
   spellingConfig,
   timingConstants,
} from "./core/config";

// ============================================================================
// Core (Lexical nodes, theme, transformers, config)
// ============================================================================
export {
   $createGhostTextNode,
   $isGhostTextNode,
   GhostTextNode,
} from "./core/ghost-text-node";
export { $createImageNode, $isImageNode, ImageNode } from "./core/image-node";
export { diffStyles, editorTheme } from "./core/theme";
export { EXTENDED_TRANSFORMERS } from "./core/transformers";
// ============================================================================
// Schemas (All Zod schemas and inferred types)
// ============================================================================
export {
   type AgentStreamChunk,
   // Agent Streaming Schemas
   AgentStreamChunkSchema,
   type ChatChunk,
   ChatChunkSchema,
   type ChatContentPart,
   ChatContentPartSchema,
   type ChatMessage,
   type ChatMessageRole,
   // Chat Schemas
   ChatMessageRoleSchema,
   ChatMessageSchema,
   type ChatState,
   ChatStateSchema,
   type ChatTextPart,
   ChatTextPartSchema,
   type ChatToolCall,
   type ChatToolCallPart,
   ChatToolCallPartSchema,
   ChatToolCallSchema,
   type ChatToolResult,
   type ChatToolResultPart,
   ChatToolResultPartSchema,
   ChatToolResultSchema,
   type CompletionSpellingResult,
   CompletionSpellingResultSchema,
   type CursorContext,
   CursorContextSchema,
   type DiagnosticsState,
   // Diagnostics Schemas
   DiagnosticsStateSchema,
   type DiffLine,
   DiffLineSchema,
   type DiffLineType,
   // Diff Schemas
   DiffLineTypeSchema,
   type DiffState,
   DiffStateSchema,
   type EditChunk,
   EditChunkSchema,
   type EditContext,
   EditContextSchema,
   type EditIntentType,
   EditIntentTypeSchema,
   type EditorConfig,
   // Editor Configuration
   EditorConfigSchema,
   type EditorFeatures,
   EditorFeaturesSchema,
   type EditorWorkerMessage,
   // Editor Worker Schemas
   EditorWorkerMessageSchema,
   type EditorWorkerResponse,
   EditorWorkerResponseSchema,
   type EditPhase,
   // Edit Schemas
   EditPhaseSchema,
   type EditPosition,
   EditPositionSchema,
   type EditRequest,
   EditRequestSchema,
   type EditState,
   EditStateSchema,
   type FIMChunk,
   type FIMChunkMetadata,
   FIMChunkMetadataSchema,
   FIMChunkSchema,
   type FIMConfidenceFactors,
   FIMConfidenceFactorsSchema,
   type FIMConfig,
   FIMConfigSchema,
   type FIMDiffSuggestion,
   FIMDiffSuggestionSchema,
   type FIMMode,
   // FIM Schemas
   FIMModeSchema,
   type FIMPosition,
   FIMPositionSchema,
   type FIMRequest,
   FIMRequestSchema,
   type FIMState,
   FIMStateSchema,
   type FIMStopReason,
   FIMStopReasonSchema,
   type FIMTriggerType,
   FIMTriggerTypeSchema,
   type ImageWidth,
   ImageWidthSchema,
   type LegacyChatChunk,
   LegacyChatChunkSchema,
   type MetaGenerationRequest,
   // Meta Generation Schemas
   MetaGenerationRequestSchema,
   type MetaGenerationResponse,
   MetaGenerationResponseSchema,
   type SelectionState,
   SelectionStateSchema,
   type ServerToolResult,
   ServerToolResultSchema,
   type SpellingError,
   // Spelling Schemas
   SpellingErrorSchema,
   type SpellWorkerMessage,
   SpellWorkerMessageSchema,
   type SpellWorkerResponse,
   SpellWorkerResponseSchema,
   type ToolCall,
   // Tool Execution Schemas
   ToolCallSchema,
   type ToolExecutionResult,
   ToolExecutionResultSchema,
} from "./schemas";

// ============================================================================
// Stores (TanStack Store state management)
// ============================================================================

// Chat Store
export {
   addChatMessage,
   appendToLastAssistantMessage,
   clearChatError,
   clearChatInput,
   clearChatMessages,
   closeChat,
   getChatState,
   openChat,
   resetChat,
   setChatError,
   setChatInput,
   setChatMessages,
   setChatSessionId,
   startChatStreaming,
   startNewChatSession,
   stopChatStreaming,
   subscribeChat,
   toggleChat,
   updateLastAssistantMessage,
   useChatContext,
   useChatState,
} from "./stores/chat-store";
// Diagnostics Store
export {
   getDiagnosticsState,
   resetDiagnostics,
   setDiagnostics,
   setDiagnosticsCalculating,
   setDiagnosticsCounts,
   setParagraphCount,
   setSentenceCount,
   subscribeDiagnostics,
   useDiagnosticsContext,
   useDiagnosticsState,
} from "./stores/diagnostics-store";
// Diff Store
export {
   clearDiff,
   countAdditions,
   countRemovals,
   getDiffState,
   hasChanges,
   hideDiff,
   showDiff,
   subscribeDiff,
   toggleDiff,
   updateDiffModified,
   useDiffContext,
   useDiffState,
} from "./stores/diff-store";
// Edit Store
export {
   acceptEdit,
   appendEditStreamedText,
   cancelEdit,
   clearEdit,
   completeEdit,
   getEditState,
   openEditPrompt,
   setEditError,
   setEditInstruction,
   setEditPlaceholderNodeKey,
   startEditStreaming,
   subscribeEdit,
   useEditContext,
   useEditState,
} from "./stores/edit-store";
// FIM Store
export {
   appendGhostText,
   clearFIM,
   completeFIMSession,
   getFIMState,
   incrementChainDepth,
   resetChain,
   setConfidence,
   setDiffSuggestion,
   setFIMLoading,
   setFIMMetrics,
   setFIMMode,
   setFIMPosition,
   setGhostText,
   setPrefetchedSuggestion,
   startFIMSession,
   startPreFetching,
   subscribeFIM,
   useFIMContext,
   useFIMState,
} from "./stores/fim-store";

// ============================================================================
// AI (Streaming, tool execution, FIM, Edit)
// ============================================================================

// Edit utilities
export {
   buildEditRequest,
   calculateEditPosition,
   getSelectedText,
   getSelectionContext,
   getSelectionState,
   isAcceptShortcut,
   isEditShortcut,
   isRejectShortcut,
   useEditCompletion,
} from "./ai/edit";
// FIM utilities
export {
   applyDiffSuggestion,
   buildCursorContext,
   calculateConfidence,
   createDiffSuggestion,
   detectEditIntent,
   detectTriggerType,
   getTriggerDelay,
   useFIMCompletion,
} from "./ai/fim";
// Streaming utilities
export {
   createStreamProcessor,
   processStream,
   processStreamChunk,
   type StreamCallbacks,
   TextAccumulator,
   ToolCallCollector,
} from "./ai/streaming";
// Tool executor
export {
   executeEditorTool,
   getEditorContent,
   getEditorMarkdown,
   getSelectionText,
   setEditorFromMarkdown,
} from "./ai/tool-executor";
export { EditPlugin } from "./plugins/edit-plugin";
// ============================================================================
// Plugins (Lexical plugins)
// ============================================================================
export { FIMPlugin } from "./plugins/fim-plugin";
export { FloatingToolbarPlugin } from "./plugins/floating-toolbar";
export { MarkdownPastePlugin } from "./plugins/markdown-paste";
export { SpellCheckerClient } from "./spelling/client";
// ============================================================================
// Spelling
// ============================================================================
export {
   SpellingErrorDecorator,
   SpellingPlugin,
   SpellingSuggestionPopover,
} from "./spelling/plugin";

// Worker file: ./spelling/worker.ts (import separately for web worker)

export { DiagnosticsClient, getDiagnosticsClient } from "./diagnostics/client";
// ============================================================================
// Diagnostics
// ============================================================================
export {
   DiagnosticsPlugin,
   formatCharCount,
   formatReadingTime,
   formatWordCount,
   useDiagnostics,
} from "./diagnostics/plugin";

// Worker file: ./diagnostics/worker.ts (import separately for web worker)

export {
   ChatKeyboardHints,
   ChatSidebar,
   ChatToggleButton,
} from "./ui/chat/chat-sidebar";
// ============================================================================
// UI Components
// ============================================================================
export { ContentEditor, type ContentEditorProps } from "./ui/content-editor";
export { DiffView, InlineDiff, SplitDiffView } from "./ui/diff-view";
export {
   EditKeyboardHints,
   EditPanel,
   EditSelectionHint,
} from "./ui/edit-panel";
export {
   EditorStatusline,
   EditorStatuslineCompact,
} from "./ui/editor-statusline";
export { FIMKeyboardHints, FIMPanel } from "./ui/fim-panel";
