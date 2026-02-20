/**
 * Content Editor Component
 *
 * Main editor component that composes all Lexical plugins.
 * Provides a complete AI-powered editing experience.
 */

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import type { EditorState, LexicalEditor } from "lexical";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
   createEditorConfig,
   createEditorFeatures,
   createFIMConfig,
} from "../core/config";
import { GhostTextNode } from "../core/ghost-text-node";
import { ImageNode } from "../core/image-node";
import { editorTheme } from "../core/theme";
import { EXTENDED_TRANSFORMERS } from "../core/transformers";
import { DiagnosticsPlugin } from "../diagnostics/plugin";
import { EditPlugin } from "../plugins/edit-plugin";
import { FIMPlugin } from "../plugins/fim-plugin";
import { FloatingToolbarPlugin } from "../plugins/floating-toolbar";
import { MarkdownPastePlugin } from "../plugins/markdown-paste";
import { SelectionContextPlugin } from "../plugins/selection-context-plugin";
import type {
   EditChunk,
   EditorConfig,
   EditorFeatures,
   EditRequest,
   FIMChunk,
   FIMConfig,
   FIMRequest,
   SpellingError,
} from "../schemas";
import { SpellingErrorDecorator, SpellingPlugin } from "../spelling/plugin";
import { cn } from "../utils";

/**
 * Lexical nodes used by the editor
 */
const EDITOR_NODES = [
   HeadingNode,
   QuoteNode,
   CodeNode,
   CodeHighlightNode,
   LinkNode,
   AutoLinkNode,
   ListNode,
   ListItemNode,
   TableNode,
   TableCellNode,
   TableRowNode,
   HorizontalRuleNode,
   GhostTextNode,
   ImageNode,
];

interface ContentEditorProps {
   /**
    * Editor configuration
    */
   config?: Partial<EditorConfig>;

   /**
    * Feature flags
    */
   features?: Partial<EditorFeatures>;

   /**
    * FIM configuration
    */
   fimConfig?: Partial<FIMConfig>;

   /**
    * FIM streaming function
    */
   fimStream?: (request: FIMRequest) => AsyncIterable<FIMChunk>;

   /**
    * Edit streaming function
    */
   editStream?: (request: EditRequest) => AsyncIterable<EditChunk>;

   /**
    * Callback when content changes
    */
   onChange?: (editorState: EditorState, editor: LexicalEditor) => void;

   /**
    * Callback when spelling errors are updated
    */
   onSpellingErrors?: (errors: SpellingError[]) => void;

   /**
    * Callback when diagnostics are updated
    */
   onDiagnostics?: (diagnostics: {
      wordCount: number;
      charCount: number;
      readingTimeMinutes: number;
      paragraphCount: number;
      sentenceCount: number;
   }) => void;

   /**
    * Callback when the Lexical editor is ready
    */
   onEditorReady?: (editor: LexicalEditor) => void;

   /**
    * Additional CSS class for the container
    */
   className?: string;

   /**
    * Additional CSS class for the content area
    */
   contentClassName?: string;

   /**
    * Placeholder text
    */
   placeholder?: string;

   /**
    * Whether the editor is editable
    */
   editable?: boolean;

   /**
    * Children (additional plugins, panels, etc.)
    */
   children?: React.ReactNode;
}

/**
 * Placeholder component
 */
function Placeholder({ text }: { text: string }): React.JSX.Element {
   return (
      <div className="absolute top-0 left-0 pointer-events-none text-muted-foreground select-none p-4">
         {text}
      </div>
   );
}

interface EditorReadyPluginProps {
   onReady?: (editor: LexicalEditor) => void;
}

function EditorReadyPlugin({ onReady }: EditorReadyPluginProps) {
   const [editor] = useLexicalComposerContext();

   useEffect(() => {
      onReady?.(editor);
   }, [editor, onReady]);

   return null;
}

/**
 * Plugin to load initial markdown content into the editor
 */
interface InitialContentPluginProps {
   markdown: string;
}

function InitialContentPlugin({ markdown }: InitialContentPluginProps) {
   const [editor] = useLexicalComposerContext();
   const hasLoadedRef = useRef(false);

   useEffect(() => {
      // Only load once on mount
      if (hasLoadedRef.current || !markdown) return;
      hasLoadedRef.current = true;

      // Load markdown content
      editor.update(() => {
         $convertFromMarkdownString(markdown, EXTENDED_TRANSFORMERS);
      });
   }, [editor, markdown]);

   return null;
}

/**
 * Content Editor Component
 *
 * A fully-featured AI-powered content editor built on Lexical.
 */
export function ContentEditor({
   config: configOverrides,
   features: featureOverrides,
   fimConfig: fimConfigOverrides,
   fimStream,
   editStream,
   onChange,
   onSpellingErrors,
   onDiagnostics,
   onEditorReady,
   className,
   contentClassName,
   placeholder,
   editable = true,
   children,
}: ContentEditorProps): React.JSX.Element {
   const containerRef = useRef<HTMLDivElement>(null);
   const [spellingErrors, setSpellingErrors] = useState<SpellingError[]>([]);

   const config = useMemo(
      () => createEditorConfig(configOverrides),
      [configOverrides],
   );
   const features = useMemo(
      () => createEditorFeatures(featureOverrides),
      [featureOverrides],
   );
   const fimConfig = useMemo(
      () => createFIMConfig(fimConfigOverrides),
      [fimConfigOverrides],
   );

   /**
    * Initial Lexical configuration
    */
   const initialConfig = useMemo(
      () => ({
         namespace: config.namespace,
         theme: editorTheme,
         nodes: EDITOR_NODES,
         editable,
         onError: (error: Error) => {
            console.error("[ContentEditor] Lexical error:", error);
         },
      }),
      [config.namespace, editable],
   );

   /**
    * Handle spelling errors update
    */
   const handleSpellingErrors = useCallback(
      (errors: SpellingError[]) => {
         setSpellingErrors(errors);
         onSpellingErrors?.(errors);
      },
      [onSpellingErrors],
   );

   /**
    * Handle editor changes
    */
   const handleChange = useCallback(
      (editorState: EditorState, editor: LexicalEditor) => {
         onChange?.(editorState, editor);
      },
      [onChange],
   );

   return (
      <LexicalComposer initialConfig={initialConfig}>
         <div className={cn("relative", className)} ref={containerRef}>
            {/* Main editor area */}
            <RichTextPlugin
               contentEditable={
                  <ContentEditable
                     className={cn(
                        "min-h-[300px] outline-none p-4",
                        "prose prose-slate dark:prose-invert max-w-none",
                        contentClassName,
                     )}
                     spellCheck={false}
                  />
               }
               ErrorBoundary={LexicalErrorBoundary}
               placeholder={
                  <Placeholder text={placeholder ?? config.placeholder ?? ""} />
               }
            />

            {/* Core plugins */}
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <TabIndentationPlugin />
            <TablePlugin />
            <MarkdownShortcutPlugin transformers={EXTENDED_TRANSFORMERS} />

            {/* Load initial markdown content */}
            <InitialContentPlugin markdown={config.initialContent ?? ""} />

            {/* Custom plugins */}
            <SelectionContextPlugin />
            <MarkdownPastePlugin enabled={editable} />
            <FloatingToolbarPlugin
               containerRef={containerRef}
               enabled={editable}
               showAIEdit={features.edit && editable}
            />

            {/* AI plugins */}
            {features.fim && fimStream && (
               <FIMPlugin
                  config={fimConfig}
                  enabled={editable}
                  streamFn={fimStream}
               />
            )}

            {features.edit && editStream && (
               <EditPlugin enabled={editable} streamFn={editStream} />
            )}

            {/* Analysis plugins */}
            {features.spelling && (
               <>
                  <SpellingPlugin
                     enabled={editable}
                     onErrorsUpdate={handleSpellingErrors}
                  />
                  <SpellingErrorDecorator
                     containerRef={containerRef}
                     errors={spellingErrors}
                  />
               </>
            )}

            {features.diagnostics && (
               <DiagnosticsPlugin enabled onUpdate={onDiagnostics} />
            )}

            <EditorReadyPlugin onReady={onEditorReady} />

            {/* Change listener */}
            <OnChangePlugin onChange={handleChange} />

            {/* Additional children (panels, etc.) */}
            {children}
         </div>
      </LexicalComposer>
   );
}

/**
 * Re-export useful types
 */
export type { ContentEditorProps };
