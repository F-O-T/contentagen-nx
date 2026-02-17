/**
 * Tool UI Registry
 *
 * Previously used makeAssistantToolUI({ toolName: "*" }) to register a wildcard
 * tool UI. This approach does NOT work — the wildcard is stored as a literal key
 * "*" in the registry and is never matched against actual tool names.
 *
 * Tool rendering is now handled via MessagePrimitive.Content's
 * `components={{ tools: { Override: ToolCallOverride } }}` prop in
 * assistant-chat-sidebar.tsx, which correctly intercepts all tool calls.
 *
 * This file is kept for reference and will be removed in Task 10.
 */
