/**
 * Floating Toolbar Plugin
 *
 * Lexical plugin for a floating text formatting toolbar.
 * Appears when text is selected, provides formatting options.
 */

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
   $getSelection,
   $isRangeSelection,
   COMMAND_PRIORITY_LOW,
   FORMAT_TEXT_COMMAND,
   SELECTION_CHANGE_COMMAND,
   type TextFormatType,
} from "lexical";
import {
   Bold,
   Code,
   Italic,
   Link,
   Sparkles,
   Strikethrough,
   Underline,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils";

interface FloatingToolbarPluginProps {
   /**
    * Whether the toolbar is enabled
    */
   enabled?: boolean;

   /**
    * Reference to the container element for relative positioning
    */
   containerRef?: React.RefObject<HTMLDivElement | null>;

   /**
    * Whether to show the AI Edit button
    */
   showAIEdit?: boolean;

   /**
    * Callback when AI Edit button is clicked
    */
   onAIEdit?: () => void;

   /**
    * Additional CSS class for the toolbar
    */
   className?: string;
}

interface ToolbarButton {
   format: TextFormatType | "link";
   icon: React.ComponentType<{ className?: string }>;
   label: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
   { format: "bold", icon: Bold, label: "Negrito" },
   { format: "italic", icon: Italic, label: "Itálico" },
   { format: "underline", icon: Underline, label: "Sublinhado" },
   { format: "strikethrough", icon: Strikethrough, label: "Tachado" },
   { format: "code", icon: Code, label: "Código" },
   { format: "link", icon: Link, label: "Link" },
];

/**
 * Floating Toolbar Plugin Component
 *
 * Shows a toolbar when text is selected with formatting options.
 */
export function FloatingToolbarPlugin({
   enabled = true,
   containerRef,
   showAIEdit = false,
   onAIEdit,
   className,
}: FloatingToolbarPluginProps): React.JSX.Element | null {
   const [editor] = useLexicalComposerContext();
   const toolbarRef = useRef<HTMLDivElement>(null);
   const [isVisible, setIsVisible] = useState(false);
   const [position, setPosition] = useState({ top: 0, left: 0 });
   const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
   const [isLink, setIsLink] = useState(false);

   // Cache container rect to avoid repeated layout reads
   const containerRectRef = useRef<DOMRect | null>(null);
   const rafIdRef = useRef<number | null>(null);

   /**
    * Invalidate container rect cache
    */
   const invalidateContainerRect = useCallback(() => {
      containerRectRef.current = null;
   }, []);

   /**
    * Get cached container rect or compute it
    */
   const getContainerRect = useCallback(() => {
      if (!containerRef?.current) return null;
      if (!containerRectRef.current) {
         containerRectRef.current =
            containerRef.current.getBoundingClientRect();
      }
      return containerRectRef.current;
   }, [containerRef]);

   /**
    * Update toolbar position based on selection
    */
   const updatePosition = useCallback(() => {
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
         cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
         rafIdRef.current = null;

         const domSelection = window.getSelection();
         if (!domSelection || domSelection.rangeCount === 0) {
            setIsVisible(false);
            return;
         }

         const range = domSelection.getRangeAt(0);
         if (range.collapsed) {
            setIsVisible(false);
            return;
         }

         // Get fresh reference to editor root (don't rely on cached value)
         const editorRoot = editor.getRootElement();
         if (!editorRoot) {
            setIsVisible(false);
            return;
         }

         // Check if selection is within the editor element
         if (!editorRoot.contains(range.commonAncestorContainer)) {
            setIsVisible(false);
            return;
         }

         // Check minimum selection length (at least 1 character)
         const selectedText = domSelection.toString();
         if (selectedText.length < 1) {
            setIsVisible(false);
            return;
         }

         const rect = range.getBoundingClientRect();
         const toolbar = toolbarRef.current;
         if (!toolbar) return;

         const toolbarWidth = toolbar.offsetWidth || 200;
         const toolbarHeight = toolbar.offsetHeight || 40;

         // Get container rect if available for relative positioning
         const containerRect = getContainerRect();

         let top: number;
         let left: number;

         if (containerRect) {
            // Position relative to container
            top = rect.top - containerRect.top - toolbarHeight - 8;
            left = Math.max(
               8,
               rect.left -
                  containerRect.left +
                  rect.width / 2 -
                  toolbarWidth / 2,
            );
            // Ensure toolbar stays within container bounds
            left = Math.min(left, containerRect.width - toolbarWidth - 8);
         } else {
            // Fallback to absolute positioning with scroll
            top = rect.top - toolbarHeight - 8 + window.scrollY;
            left = Math.max(
               8,
               rect.left + rect.width / 2 - toolbarWidth / 2 + window.scrollX,
            );
         }

         setPosition({ top, left });
         setIsVisible(true);
      });
   }, [editor, getContainerRect]);

   /**
    * Update active formats based on selection
    */
   const updateFormats = useCallback(() => {
      editor.getEditorState().read(() => {
         const selection = $getSelection();
         if (!$isRangeSelection(selection)) {
            setActiveFormats(new Set());
            setIsLink(false);
            return;
         }

         const formats = new Set<string>();

         if (selection.hasFormat("bold")) formats.add("bold");
         if (selection.hasFormat("italic")) formats.add("italic");
         if (selection.hasFormat("underline")) formats.add("underline");
         if (selection.hasFormat("strikethrough")) formats.add("strikethrough");
         if (selection.hasFormat("code")) formats.add("code");

         // Check for link
         const nodes = selection.getNodes();
         const isLinkActive = nodes.some((node) => {
            const parent = node.getParent();
            return $isLinkNode(parent) || $isLinkNode(node);
         });

         setActiveFormats(formats);
         setIsLink(isLinkActive);
      });
   }, [editor]);

   /**
    * Handle format button click
    */
   const handleFormat = useCallback(
      (format: TextFormatType | "link") => {
         if (format === "link") {
            // Toggle link - for now just remove if active
            if (isLink) {
               editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            } else {
               // Prompt for URL
               const url = window.prompt("Digite a URL:");
               if (url) {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
               }
            }
         } else {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
         }
      },
      [editor, isLink],
   );

   /**
    * Handle AI Edit button click
    */
   const handleAIEdit = useCallback(() => {
      // Call the EditPlugin's open function if available
      // @ts-expect-error - EditPlugin attaches this to the editor
      const editPlugin = editor.__editPlugin;
      if (editPlugin?.open) {
         // Use RAF to ensure DOM selection is synced with Lexical
         requestAnimationFrame(() => {
            editPlugin.open();
         });
      }
      onAIEdit?.();
   }, [editor, onAIEdit]);

   // Listen for selection changes
   useEffect(() => {
      if (!enabled) return;

      const removeListener = editor.registerCommand(
         SELECTION_CHANGE_COMMAND,
         () => {
            updatePosition();
            updateFormats();
            return false;
         },
         COMMAND_PRIORITY_LOW,
      );

      // Also listen for mouse up
      const handleMouseUp = () => {
         setTimeout(() => {
            updatePosition();
            updateFormats();
         }, 10);
      };

      document.addEventListener("mouseup", handleMouseUp);

      return () => {
         removeListener();
         document.removeEventListener("mouseup", handleMouseUp);
         // Cleanup RAF on unmount
         if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
         }
      };
   }, [editor, enabled, updatePosition, updateFormats]);

   // Invalidate container rect and update position on scroll/resize
   useEffect(() => {
      const handleScrollOrResize = () => {
         invalidateContainerRect();
         if (isVisible) {
            updatePosition();
         }
      };

      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      return () => {
         window.removeEventListener("scroll", handleScrollOrResize, true);
         window.removeEventListener("resize", handleScrollOrResize);
      };
   }, [isVisible, updatePosition, invalidateContainerRect]);

   if (!enabled || !isVisible) {
      return null;
   }

   // Determine if we should use fixed or absolute positioning
   const positionStyle = containerRef?.current
      ? {
           position: "absolute" as const,
           top: position.top,
           left: position.left,
        }
      : { position: "fixed" as const, top: position.top, left: position.left };

   return createPortal(
      <div
         className={cn(
            "z-[100] flex items-center gap-0.5 p-1 rounded-lg",
            "bg-popover border border-border shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            className,
         )}
         ref={toolbarRef}
         style={positionStyle}
      >
         {TOOLBAR_BUTTONS.map(({ format, icon: Icon, label }) => (
            <button
               className={cn(
                  "p-1.5 rounded hover:bg-accent transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  activeFormats.has(format) || (format === "link" && isLink)
                     ? "bg-accent text-accent-foreground"
                     : "text-muted-foreground",
               )}
               key={format}
               onClick={() => handleFormat(format)}
               title={label}
               type="button"
            >
               <Icon className="h-4 w-4" />
            </button>
         ))}

         {/* AI Edit button */}
         {showAIEdit && (
            <>
               {/* Divider */}
               <div className="w-px h-5 bg-border mx-1" />
               <button
                  className={cn(
                     "p-1.5 rounded hover:bg-accent transition-colors",
                     "focus:outline-none focus:ring-2 focus:ring-ring",
                     "text-muted-foreground hover:text-primary",
                  )}
                  onClick={handleAIEdit}
                  title="Editar com IA (Ctrl+K)"
                  type="button"
               >
                  <Sparkles className="h-4 w-4" />
               </button>
            </>
         )}
      </div>,
      containerRef?.current || document.body,
   );
}
