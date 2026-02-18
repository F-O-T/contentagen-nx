/**
 * SelectionContextPlugin
 *
 * Listens to Lexical selection changes and syncs selected text +
 * cursor paragraph to EditorContextStore for use in chat context.
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { setEditorSelection } from "@/layout/editor/stores/editor-context-store";

export function SelectionContextPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            setEditorSelection(null, null);
            return;
          }

          const selectedText = selection.getTextContent().trim();

          // Get the top-level block the cursor is in
          const anchorNode = selection.anchor.getNode();
          const topNode = anchorNode.getTopLevelElement();
          const cursorParagraph = topNode?.getTextContent().trim() ?? null;

          setEditorSelection(
            selectedText.length > 0 ? selectedText : null,
            cursorParagraph,
          );
        });
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}
