/**
 * EditorContextStore
 *
 * Tracks editor selection state for injection into chat agent calls.
 * Updated by SelectionContextPlugin inside the Lexical editor.
 */
import { Store } from "@tanstack/react-store";

interface EditorContextState {
  selectedText: string | null;
  cursorParagraph: string | null;
  documentMarkdown: string | null;
}

export const editorContextStore = new Store<EditorContextState>({
  selectedText: null,
  cursorParagraph: null,
  documentMarkdown: null,
});

export function setEditorSelection(selectedText: string | null, cursorParagraph: string | null) {
  editorContextStore.setState((s) => ({ ...s, selectedText, cursorParagraph }));
}

export function setEditorDocument(documentMarkdown: string | null) {
  editorContextStore.setState((s) => ({ ...s, documentMarkdown }));
}

export function getEditorContext(): EditorContextState {
  return editorContextStore.state;
}
