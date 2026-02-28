import { MarkdownPlugin, deserializeMd, serializeMd } from "@platejs/markdown";
import type { Value } from "platejs";
import { createSlateEditor } from "platejs";
import remarkGfm from "remark-gfm";

let _editor: ReturnType<typeof createSlateEditor> | null = null;

function getEditor() {
   if (!_editor) {
      _editor = createSlateEditor({
         plugins: [
            MarkdownPlugin.configure({
               options: { remarkPlugins: [remarkGfm] },
            }),
         ],
      });
   }
   return _editor;
}

export function markdownToPlateValue(markdown: string): Value {
   const editor = getEditor();
   return deserializeMd(editor, markdown);
}

export function plateValueToMarkdown(value: Value): string {
   const editor = getEditor();
   editor.children = value;
   return serializeMd(editor);
}
