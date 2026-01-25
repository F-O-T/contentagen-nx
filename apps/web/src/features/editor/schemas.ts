/**
 * Editor Package Schemas
 *
 * All Zod schemas for the editor package are defined here.
 * No separate types.ts files - types are inferred from schemas.
 */
import { z } from "zod";

// ============================================================================
// Editor Configuration Schemas
// ============================================================================

export const EditorConfigSchema = z.object({
   namespace: z.string().default("contentta-editor"),
   initialContent: z.string().optional(),
   placeholder: z.string().optional(),
   editable: z.boolean().default(true),
});
export type EditorConfig = z.infer<typeof EditorConfigSchema>;

export const EditorFeaturesSchema = z.object({
   fim: z.boolean().default(true),
   edit: z.boolean().default(true),
   chat: z.boolean().default(true),
   spelling: z.boolean().default(true),
   diagnostics: z.boolean().default(true),
});
export type EditorFeatures = z.infer<typeof EditorFeaturesSchema>;

// ============================================================================
// FIM (Fill-in-Middle) Schemas
// ============================================================================

export const FIMModeSchema = z.enum(["idle", "copilot", "cursor-tab", "diff"]);
export type FIMMode = z.infer<typeof FIMModeSchema>;

export const FIMTriggerTypeSchema = z.enum([
   "debounce",
   "keystroke",
   "cursor-move",
   "punctuation",
   "newline",
   "chain",
   "edit-prediction",
   "manual",
]);
export type FIMTriggerType = z.infer<typeof FIMTriggerTypeSchema>;

export const FIMStopReasonSchema = z.enum([
   "natural",
   "token_limit",
   "stop_sequence",
]);
export type FIMStopReason = z.infer<typeof FIMStopReasonSchema>;

export const EditIntentTypeSchema = z.enum([
   "continuation",
   "insertion",
   "correction",
   "completion",
]);
export type EditIntentType = z.infer<typeof EditIntentTypeSchema>;

export const FIMConfidenceFactorsSchema = z.object({
   length: z.number().min(0).max(1),
   prefixSimilarity: z.number().min(0).max(1),
   stopReason: z.number().min(0).max(1),
   latency: z.number().min(0).max(1),
   repetition: z.number().min(0).max(1),
});
export type FIMConfidenceFactors = z.infer<typeof FIMConfidenceFactorsSchema>;

export const FIMPositionSchema = z.object({
   top: z.number(),
   left: z.number(),
   maxWidth: z.number().optional(),
});
export type FIMPosition = z.infer<typeof FIMPositionSchema>;

export const FIMDiffSuggestionSchema = z.object({
   type: z.enum(["insert", "replace"]),
   original: z.string().optional(),
   suggestion: z.string(),
   replaceRange: z
      .object({
         start: z.number(),
         end: z.number(),
      })
      .optional(),
});
export type FIMDiffSuggestion = z.infer<typeof FIMDiffSuggestionSchema>;

export const FIMChunkMetadataSchema = z.object({
   stopReason: FIMStopReasonSchema.optional(),
   latencyMs: z.number().optional(),
   confidence: z.number().optional(),
   shouldShow: z.boolean().optional(),
   factors: FIMConfidenceFactorsSchema.optional(),
});
export type FIMChunkMetadata = z.infer<typeof FIMChunkMetadataSchema>;

export const FIMChunkSchema = z.object({
   text: z.string(),
   done: z.boolean(),
   metadata: FIMChunkMetadataSchema.optional(),
});
export type FIMChunk = z.infer<typeof FIMChunkSchema>;

export const FIMConfigSchema = z.object({
   debounceMs: z.number().default(500),
   punctuationDelayMs: z.number().default(150),
   newlineDelayMs: z.number().default(100),
   cursorMoveDelayMs: z.number().default(400),
   editPredictionDelayMs: z.number().default(700),
   confidenceThreshold: z.number().default(0.7),
   maxChainDepth: z.number().default(5),
});
export type FIMConfig = z.infer<typeof FIMConfigSchema>;

export const EditContextSchema = z.object({
   intent: EditIntentTypeSchema,
   cursorDistanceFromEnd: z.number(),
   isInEditingMode: z.boolean(),
   isAfterIncomplete: z.boolean().optional(),
   hasSentencePattern: z.boolean().optional(),
});
export type EditContext = z.infer<typeof EditContextSchema>;

export const CursorContextSchema = z.object({
   isEndOfParagraph: z.boolean(),
   isEndOfSentence: z.boolean(),
   isAfterPunctuation: z.boolean(),
});
export type CursorContext = z.infer<typeof CursorContextSchema>;

export const FIMRequestSchema = z.object({
   prefix: z.string(),
   suffix: z.string().optional(),
   contextType: z.enum(["document", "code"]).optional(),
   maxTokens: z.number().optional(),
   temperature: z.number().optional(),
   stopSequences: z.array(z.string()).optional(),
   triggerType: FIMTriggerTypeSchema.optional(),
   recentText: z.string().optional(),
   cursorContext: CursorContextSchema.optional(),
   editContext: EditContextSchema.optional(),
});
export type FIMRequest = z.infer<typeof FIMRequestSchema>;

export const FIMStateSchema = z.object({
   mode: FIMModeSchema,
   ghostText: z.string(),
   isVisible: z.boolean(),
   isLoading: z.boolean(),
   position: FIMPositionSchema.nullable(),
   completionId: z.string().nullable(),
   triggerType: FIMTriggerTypeSchema.nullable(),
   isManualTrigger: z.boolean(),
   confidenceScore: z.number().nullable(),
   confidenceFactors: FIMConfidenceFactorsSchema.nullable(),
   shouldShow: z.boolean(),
   diffSuggestion: FIMDiffSuggestionSchema.nullable(),
   chainDepth: z.number(),
   lastAcceptPosition: z.number().nullable(),
   isPreFetching: z.boolean(),
   prefetchedSuggestion: z.string().nullable(),
   lastLatencyMs: z.number().nullable(),
   lastStopReason: z.string().nullable(),
});
export type FIMState = z.infer<typeof FIMStateSchema>;

// ============================================================================
// Edit Schemas
// ============================================================================

export const EditPhaseSchema = z.enum([
   "idle",
   "prompting",
   "streaming",
   "complete",
]);
export type EditPhase = z.infer<typeof EditPhaseSchema>;

export const EditPositionSchema = z.object({
   top: z.number(),
   left: z.number(),
});
export type EditPosition = z.infer<typeof EditPositionSchema>;

export const SelectionStateSchema = z.object({
   anchorKey: z.string(),
   anchorOffset: z.number(),
   focusKey: z.string(),
   focusOffset: z.number(),
});
export type SelectionState = z.infer<typeof SelectionStateSchema>;

export const EditRequestSchema = z.object({
   selectedText: z.string(),
   instruction: z.string(),
   contextBefore: z.string().optional(),
   contextAfter: z.string().optional(),
   maxTokens: z.number().optional(),
   temperature: z.number().optional(),
});
export type EditRequest = z.infer<typeof EditRequestSchema>;

export const EditChunkSchema = z.object({
   text: z.string(),
   done: z.boolean(),
});
export type EditChunk = z.infer<typeof EditChunkSchema>;

export const EditStateSchema = z.object({
   phase: EditPhaseSchema,
   position: EditPositionSchema.nullable(),
   selectedText: z.string(),
   instruction: z.string(),
   streamedResult: z.string(),
   originalSelection: SelectionStateSchema.nullable(),
   placeholderNodeKey: z.string().nullable(),
   editId: z.string().nullable(),
   error: z
      .custom<Error>((val) => val instanceof Error || val === null)
      .nullable(),
});
export type EditState = z.infer<typeof EditStateSchema>;

// ============================================================================
// Chat Schemas
// ============================================================================

export const ChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

// Tool call representation for chat
export const ChatToolCallSchema = z.object({
   id: z.string(),
   name: z.string(),
   args: z.record(z.string(), z.unknown()),
});
export type ChatToolCall = z.infer<typeof ChatToolCallSchema>;

// Tool result representation
export const ChatToolResultSchema = z.object({
   toolCallId: z.string(),
   toolName: z.string(),
   result: z.unknown(),
});
export type ChatToolResult = z.infer<typeof ChatToolResultSchema>;

// Message content parts for assistant-ui compatibility
export const ChatTextPartSchema = z.object({
   type: z.literal("text"),
   text: z.string(),
});
export type ChatTextPart = z.infer<typeof ChatTextPartSchema>;

export const ChatToolCallPartSchema = z.object({
   type: z.literal("tool-call"),
   toolCallId: z.string(),
   toolName: z.string(),
   args: z.record(z.string(), z.unknown()),
});
export type ChatToolCallPart = z.infer<typeof ChatToolCallPartSchema>;

export const ChatToolResultPartSchema = z.object({
   type: z.literal("tool-result"),
   toolCallId: z.string(),
   toolName: z.string(),
   result: z.unknown(),
});
export type ChatToolResultPart = z.infer<typeof ChatToolResultPartSchema>;

export const ChatContentPartSchema = z.discriminatedUnion("type", [
   ChatTextPartSchema,
   ChatToolCallPartSchema,
   ChatToolResultPartSchema,
]);
export type ChatContentPart = z.infer<typeof ChatContentPartSchema>;

export const ChatMessageSchema = z.object({
   id: z.string(),
   role: ChatMessageRoleSchema,
   content: z.union([z.string(), z.array(ChatContentPartSchema)]),
   createdAt: z.date(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Stream chunk schema - discriminated union for different event types
export const ChatChunkSchema = z.discriminatedUnion("type", [
   z.object({
      type: z.literal("text"),
      text: z.string(),
   }),
   z.object({
      type: z.literal("tool_call_start"),
      toolCall: ChatToolCallSchema,
   }),
   z.object({
      type: z.literal("tool_call_delta"),
      toolCallId: z.string(),
      argsText: z.string(),
   }),
   z.object({
      type: z.literal("tool_call_complete"),
      toolCallId: z.string(),
      toolName: z.string(),
      result: z.unknown(),
   }),
   z.object({
      type: z.literal("step_start"),
      stepIndex: z.number(),
   }),
   z.object({
      type: z.literal("step_complete"),
      stepIndex: z.number(),
   }),
   z.object({
      type: z.literal("done"),
   }),
   z.object({
      type: z.literal("error"),
      error: z.string(),
   }),
]);
export type ChatChunk = z.infer<typeof ChatChunkSchema>;

// Legacy chunk schema for backward compatibility
export const LegacyChatChunkSchema = z.object({
   text: z.string(),
   done: z.boolean(),
});
export type LegacyChatChunk = z.infer<typeof LegacyChatChunkSchema>;

export const ChatStateSchema = z.object({
   isOpen: z.boolean(),
   messages: z.array(ChatMessageSchema),
   isStreaming: z.boolean(),
   currentInput: z.string(),
   sessionId: z.string().nullable(),
   error: z
      .custom<Error>((val) => val instanceof Error || val === null)
      .nullable(),
});
export type ChatState = z.infer<typeof ChatStateSchema>;

// ============================================================================
// Spelling Schemas (moved before Diagnostics to resolve dependency)
// ============================================================================

export const SpellingErrorSchema = z.object({
   id: z.string(),
   type: z.literal("spelling"),
   original: z.string(),
   suggestion: z.string(),
   offset: z.number(),
   length: z.number(),
   message: z.string(),
});
export type SpellingError = z.infer<typeof SpellingErrorSchema>;

export const CompletionSpellingResultSchema = z.object({
   score: z.number(),
   wordCount: z.number(),
   errorCount: z.number(),
   shouldShow: z.boolean(),
});
export type CompletionSpellingResult = z.infer<
   typeof CompletionSpellingResultSchema
>;

export const SpellWorkerMessageSchema = z.discriminatedUnion("type", [
   z.object({ type: z.literal("init") }),
   z.object({ type: z.literal("check"), id: z.string(), text: z.string() }),
   z.object({ type: z.literal("suggest"), id: z.string(), word: z.string() }),
   z.object({
      type: z.literal("check-completion"),
      id: z.string(),
      completion: z.string(),
   }),
   z.object({ type: z.literal("cancel"), id: z.string() }),
]);
export type SpellWorkerMessage = z.infer<typeof SpellWorkerMessageSchema>;

export const SpellWorkerResponseSchema = z.discriminatedUnion("type", [
   z.object({ type: z.literal("ready") }),
   z.object({
      type: z.literal("check-progress"),
      id: z.string(),
      errors: z.array(SpellingErrorSchema),
      done: z.boolean(),
   }),
   z.object({
      type: z.literal("suggest-result"),
      id: z.string(),
      suggestions: z.array(z.string()),
   }),
   z.object({
      type: z.literal("check-completion-result"),
      id: z.string(),
      result: CompletionSpellingResultSchema,
   }),
   z.object({
      type: z.literal("error"),
      id: z.string().optional(),
      message: z.string(),
   }),
]);
export type SpellWorkerResponse = z.infer<typeof SpellWorkerResponseSchema>;

// ============================================================================
// Diagnostics Schemas
// ============================================================================

export const DiagnosticsStateSchema = z.object({
   wordCount: z.number(),
   charCount: z.number(),
   readingTimeMinutes: z.number(),
   paragraphCount: z.number(),
   sentenceCount: z.number(),
   isCalculating: z.boolean(),
   // Spelling diagnostics
   spellingErrors: z.array(SpellingErrorSchema).default([]),
   grammarErrors: z.array(z.string()).default([]),
   isCheckingSpelling: z.boolean().default(false),
});
export type DiagnosticsState = z.infer<typeof DiagnosticsStateSchema>;

// ============================================================================
// Diff Schemas
// ============================================================================

export const DiffLineTypeSchema = z.enum(["unchanged", "added", "removed"]);
export type DiffLineType = z.infer<typeof DiffLineTypeSchema>;

export const DiffLineSchema = z.object({
   type: DiffLineTypeSchema,
   content: z.string(),
   lineNumber: z.number().optional(),
});
export type DiffLine = z.infer<typeof DiffLineSchema>;

export const DiffStateSchema = z.object({
   isVisible: z.boolean(),
   original: z.string(),
   modified: z.string(),
   lines: z.array(DiffLineSchema),
});
export type DiffState = z.infer<typeof DiffStateSchema>;

// ============================================================================
// Editor Worker Schemas
// ============================================================================

export const EditorWorkerMessageSchema = z.discriminatedUnion("type", [
   z.object({ type: z.literal("init") }),
   z.object({ type: z.literal("count"), id: z.string(), text: z.string() }),
   z.object({
      type: z.literal("seo-audit"),
      id: z.string(),
      content: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      targetKeywords: z.array(z.string()).optional(),
   }),
   z.object({ type: z.literal("cancel"), id: z.string() }),
]);
export type EditorWorkerMessage = z.infer<typeof EditorWorkerMessageSchema>;

export const EditorWorkerResponseSchema = z.discriminatedUnion("type", [
   z.object({ type: z.literal("ready") }),
   z.object({
      type: z.literal("count-result"),
      id: z.string(),
      wordCount: z.number(),
      charCount: z.number(),
   }),
   z.object({
      type: z.literal("seo-audit-result"),
      id: z.string(),
      result: z.unknown(),
   }),
   z.object({
      type: z.literal("error"),
      id: z.string().optional(),
      message: z.string(),
   }),
]);
export type EditorWorkerResponse = z.infer<typeof EditorWorkerResponseSchema>;

// ============================================================================
// Tool Execution Schemas
// ============================================================================

export const ToolCallSchema = z.object({
   id: z.string(),
   name: z.string(),
   args: z.record(z.string(), z.unknown()),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ServerToolResultSchema = z.object({
   success: z.boolean(),
   markdown: z.string().optional(),
   insertedText: z.string().optional(),
   position: z.string().optional(),
   level: z.string().optional(),
   text: z.string().optional(),
});
export type ServerToolResult = z.infer<typeof ServerToolResultSchema>;

export const ToolExecutionResultSchema = z.object({
   success: z.boolean(),
   message: z.string().optional(),
   data: z.unknown().optional(),
});
export type ToolExecutionResult = z.infer<typeof ToolExecutionResultSchema>;

export const ImageWidthSchema = z.enum(["small", "medium", "large", "full"]);
export type ImageWidth = z.infer<typeof ImageWidthSchema>;

// ============================================================================
// Agent Streaming Schemas
// ============================================================================

export const AgentStreamChunkSchema = z.discriminatedUnion("type", [
   z.object({ type: z.literal("step_start"), stepIndex: z.number() }),
   z.object({
      type: z.literal("text"),
      text: z.string(),
      stepIndex: z.number(),
      done: z.boolean().optional(),
   }),
   z.object({
      type: z.literal("tool_call_start"),
      toolCall: ToolCallSchema,
      stepIndex: z.number(),
   }),
   z.object({
      type: z.literal("tool_call_complete"),
      toolCallId: z.string(),
      result: z.unknown(),
      stepIndex: z.number(),
   }),
   z.object({ type: z.literal("step_complete"), stepIndex: z.number() }),
   z.object({ type: z.literal("done") }),
   z.object({ type: z.literal("error"), error: z.string() }),
]);
export type AgentStreamChunk = z.infer<typeof AgentStreamChunkSchema>;

// ============================================================================
// Meta Generation Schemas
// ============================================================================

export const MetaGenerationRequestSchema = z.object({
   type: z.enum(["description", "keywords", "all"]),
   title: z.string(),
   content: z.string(),
   existingKeywords: z.array(z.string()).optional(),
   maxTokens: z.number().optional(),
   temperature: z.number().optional(),
});
export type MetaGenerationRequest = z.infer<typeof MetaGenerationRequestSchema>;

export const MetaGenerationResponseSchema = z.object({
   description: z.string().optional(),
   keywords: z.array(z.string()).optional(),
});
export type MetaGenerationResponse = z.infer<
   typeof MetaGenerationResponseSchema
>;
