/**
 * Main IDE-style layout container - Nvim-inspired Design
 *
 * Features:
 * - Centered editor content (max-w-3xl)
 * - Toggleable diagnostics panel (bottom)
 * - Toggleable chat sidebar (right) with assistant-ui integration
 * - Lualine-style status bar with clickable sections
 */

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import type { ContentMeta } from "@packages/database/schemas/content";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { LexicalEditor } from "lexical";
import {
   lazy,
   Suspense,
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react";
import type {
   EditChunk,
   EditRequest,
   FIMChunk,
   FIMRequest,
} from "@/features/editor/schemas";
import { useDiffState } from "@/features/editor/stores/diff-store";
import { useEditState } from "@/features/editor/stores/edit-store";
import { useFIMState } from "@/features/editor/stores/fim-store";
import type {
   ContentEditorHandle,
   ContentEditorProps,
} from "@/features/editor/ui/content-editor";
import { DiffView } from "@/features/editor/ui/diff-view";
import { EditPanel, EditSelectionHint } from "@/features/editor/ui/edit-panel";
import { EditorStatusline } from "@/features/editor/ui/editor-statusline";
import { FIMPanel } from "@/features/editor/ui/fim-panel";
import { useContenttaRuntime } from "../hooks/use-contentta-runtime";
import {
   resetEditorState,
   setCommandPaletteOpen,
   toggleChatSidebar,
   toggleCommandPalette,
   toggleConfigPanel,
   toggleDiagnosticsPanel,
   toggleSeoAuditSidebar,
   useChatSidebar,
   useConfigPanel,
   useDiagnosticsPanel,
   useEditorConfig,
   useSeoAuditSidebar,
} from "../hooks/use-editor-state";
import { useManualSave } from "../hooks/use-manual-save";
import { useStreamingToolBridge } from "../hooks/use-streaming-tool-bridge";
import { setEditorDocument } from "../stores/editor-context-store";
import { AssistantChatSidebar } from "./assistant-chat-sidebar";
import { DiagnosticsPanel } from "./diagnostics-panel";
import { EditorCommandPalette } from "./editor-command-palette";
import { EditorConfigPanel } from "./editor-config-panel";
import { EditorNavBar } from "./editor-nav-bar";
import { InlineFrontmatter } from "./inline-frontmatter";
import { SeoAuditSidebar } from "./seo-audit-sidebar";

/**
 * Lazy-loaded ContentEditor — keeps @lexical/code and prismjs out of the
 * static module graph so they never reach the Nitro SSR bundle.
 */
const ContentEditor = lazy(
   () => import("@/features/editor/ui/content-editor-lazy"),
) as React.LazyExoticComponent<React.ComponentType<ContentEditorProps>>;

interface EditorLayoutProps {
   contentId: string;
   content: {
      id: string;
      body: string | null;
      status: string;
      meta?: ContentMeta | null;
   };
   onSave: (data: {
      body?: string;
      meta?: Partial<ContentMeta>;
   }) => Promise<void>;
   onPublish: () => void;
   onArchive: () => void;
   onDelete: () => void;
   // Editor features
   features: {
      fim: boolean;
      edit: boolean;
      spelling: boolean;
      diagnostics: boolean;
   };
   // Stream functions
   fimStream?: (request: FIMRequest) => AsyncIterable<FIMChunk>;
   editStream?: (request: EditRequest) => AsyncIterable<EditChunk>;
   // Standalone mode (nova rota)
   isStandalone?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function EditorLayout({
   contentId,
   content,
   onSave,
   onPublish,
   onArchive,
   onDelete,
   features,
   fimStream,
   editStream,
   isStandalone = false,
}: EditorLayoutProps) {
   const navigate = useNavigate();
   const params = useParams({ strict: false }) as {
      slug: string;
      teamId: string;
   };
   const slug = params.slug;
   const teamId = params.teamId;
   const diagnosticsOpen = useDiagnosticsPanel();
   const { open: chatOpen } = useChatSidebar();
   const { open: seoAuditOpen } = useSeoAuditSidebar();
   const configOpen = useConfigPanel();

   const editorConfig = useEditorConfig();
   const [isSaving, setIsSaving] = useState(false);
   const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(
      null,
   );
   const contentEditorRef = useRef<ContentEditorHandle | null>(null);

   // Create assistant-ui runtime with contentId for context
   const runtime = useContenttaRuntime({ contentId });

   const isArchived = content.status === "archived";

   const resolvedFeatures = {
      fim: features.fim && editorConfig.fimEnabled,
      edit: features.edit && editorConfig.editEnabled,
      spelling: features.spelling && editorConfig.spellingEnabled,
      diagnostics: features.diagnostics && editorConfig.spellingEnabled,
   };

   // Manual save hook
   const { save, saveBody, saveMeta } = useManualSave({
      contentId,
      onSave,
      isArchived,
   });

   // Calculate stats for status bar
   const wordCount = useMemo(() => {
      const text = content.body || "";
      const words = text.trim().split(/\s+/).filter(Boolean);
      return words.length;
   }, [content.body]);

   const readingTime = useMemo(() => {
      return Math.max(1, Math.ceil(wordCount / 200));
   }, [wordCount]);

   // Handle navigation back
   const handleBack = useCallback(() => {
      navigate({ to: `/${slug}/${teamId}/content` });
   }, [navigate, slug, teamId]);

   // Handle save with loading state
   const handleSave = useCallback(async () => {
      setIsSaving(true);
      try {
         await save();
      } finally {
         setIsSaving(false);
      }
   }, [save]);

   // Handle meta update
   const handleMetaUpdate = useCallback(
      (meta: Partial<ContentMeta>) => {
         saveMeta(meta);
      },
      [saveMeta],
   );

   // Keyboard shortcuts
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         const isMod = e.metaKey || e.ctrlKey;

         // Ctrl+S - Salvar
         if (isMod && e.key === "s") {
            e.preventDefault();
            handleSave();
            return;
         }

         // Ctrl+Shift+P - Command palette
         if (isMod && e.shiftKey && e.key === "p") {
            e.preventDefault();
            toggleCommandPalette();
            return;
         }

         // Ctrl+B - Toggle chat sidebar
         if (isMod && e.key === "b") {
            e.preventDefault();
            toggleChatSidebar();
            return;
         }

         // Ctrl+Shift+D - Toggle diagnostics panel
         if (isMod && e.shiftKey && e.key === "d") {
            e.preventDefault();
            toggleDiagnosticsPanel();
            return;
         }

         // Escape - Close command palette
         if (e.key === "Escape") {
            setCommandPaletteOpen(false);
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [handleSave]);

   // Reset editor state when unmounting
   useEffect(() => {
      return () => {
         resetEditorState();
      };
   }, []);

   // Layout class based on mode
   const layoutClass = isStandalone
      ? "flex flex-col h-screen bg-background"
      : "flex flex-col h-[calc(100vh-4rem)] -m-4 bg-background";

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         {/* Tool execution bridge - must be inside provider to access useThread */}
         <ToolExecutionBridgeWrapper
            editor={editorInstance}
            onFrontmatterUpdate={handleMetaUpdate}
            onSetContent={(markdown) => {
               contentEditorRef.current?.setContent(markdown);
            }}
         />

         <div className={layoutClass}>
            {/* Nav bar */}
            <EditorNavBar
               isSaving={isSaving}
               onArchive={onArchive}
               onBack={handleBack}
               onDelete={onDelete}
               onPublish={onPublish}
               onSave={handleSave}
               slug={content.meta?.slug || ""}
               status={content.status}
            />

            {/* Main content area */}
            <div className="flex flex-1 min-h-0">
               {/* Editor area - centered content */}
               <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Inline frontmatter - centered */}
                  <div className="max-w-7xl mx-auto w-full px-4">
                     <InlineFrontmatter
                        meta={content.meta}
                        onUpdate={handleMetaUpdate}
                     />
                  </div>

                  {/* Main editor - centered */}
                  <div className="flex-1 overflow-auto">
                     <div className="max-w-7xl mx-auto p-4">
                        <Suspense fallback={null}>
                           <ContentEditor
                              className="min-h-full"
                              config={{
                                 namespace: "contentta-ide",
                                 initialContent: content.body || "",
                              }}
                              contentRef={contentEditorRef}
                              editable={!isArchived}
                              editStream={
                                 resolvedFeatures.edit ? editStream : undefined
                              }
                              features={resolvedFeatures}
                              fimConfig={{
                                 debounceMs: editorConfig.fimDebounceMs,
                                 confidenceThreshold:
                                    editorConfig.fimConfidenceThreshold,
                              }}
                              fimStream={
                                 resolvedFeatures.fim ? fimStream : undefined
                              }
                              key={contentId}
                              onEditorReady={setEditorInstance}
                              onMarkdownChange={(markdown) => {
                                 saveBody(markdown);
                                 setEditorDocument(markdown);
                              }}
                              placeholder="Comece a escrever seu conteudo..."
                           >
                              {/* AI Panels rendered inside editor context */}
                              <EditPanelWrapper />
                              <FIMPanelWrapper />
                              <DiffViewWrapper />
                              <EditSelectionHint />
                           </ContentEditor>
                        </Suspense>
                     </div>
                  </div>

                  {/* Diagnostics panel (toggleable bottom panel) - centered */}
                  {diagnosticsOpen && features.diagnostics && (
                     <div className="border-t bg-muted/30">
                        <div className="max-w-7xl mx-auto">
                           <DiagnosticsPanel />
                        </div>
                     </div>
                  )}
               </div>

               {/* Chat sidebar (toggleable, slides from right) */}
               {chatOpen && (
                  <AssistantChatSidebar
                     readingTime={readingTime}
                     wordCount={wordCount}
                  />
               )}

               {/* SEO audit sidebar */}
               <SeoAuditSidebar
                  content={content.body || ""}
                  meta={content.meta}
               />

               {/* Config panel (overlay) */}
               <EditorConfigPanel />
            </div>

            {/* Lualine-style status bar - centered */}
            <div className="border-t bg-muted">
               <div className="max-w-7xl mx-auto">
                  <EditorStatusline
                     chatOpen={chatOpen}
                     configOpen={configOpen}
                     diagnosticsOpen={diagnosticsOpen}
                     onAIClick={toggleChatSidebar}
                     onConfigClick={toggleConfigPanel}
                     onDiagnosticsClick={toggleDiagnosticsPanel}
                     onSeoAuditClick={toggleSeoAuditSidebar}
                     seoAuditOpen={seoAuditOpen}
                  />
               </div>
            </div>

            {/* Command palette */}
            <EditorCommandPalette
               onArchive={onArchive}
               onDelete={onDelete}
               onPublish={onPublish}
               onSave={handleSave}
               status={content.status}
            />
         </div>
      </AssistantRuntimeProvider>
   );
}

// ============================================================================
// Wrapper Components for AI Panels
// ============================================================================

function EditPanelWrapper() {
   const editState = useEditState();
   if (editState.phase === "idle") return null;
   return <EditPanel />;
}

function FIMPanelWrapper() {
   const fimState = useFIMState();
   if (!fimState.isVisible || !fimState.ghostText) return null;
   return <FIMPanel showConfidence />;
}

function DiffViewWrapper() {
   const diffState = useDiffState();
   if (!diffState.isVisible) return null;
   return <DiffView />;
}

/**
 * Tool Execution Bridge Wrapper
 * Must be rendered inside AssistantRuntimeProvider to access useThread hook
 */
interface ToolExecutionBridgeWrapperProps {
   editor: LexicalEditor | null;
   onFrontmatterUpdate: (meta: Partial<ContentMeta>) => void;
   /** Called when the agent-writer produces markdown content to load into editor */
   onSetContent?: (markdown: string) => void;
}

function ToolExecutionBridgeWrapper({
   editor,
   onFrontmatterUpdate,
   onSetContent,
}: ToolExecutionBridgeWrapperProps) {
   useStreamingToolBridge({
      editor,
      onFrontmatterUpdate,
      onSetContent,
   });
   return null;
}
