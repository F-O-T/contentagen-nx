import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

interface GeneratedContentEditorProps {
   content: string;
   onSave: (content: string) => void;
   onCancel: () => void;
}

export function GeneratedContentEditor({
   content,
   onSave,
   onCancel,
}: GeneratedContentEditorProps) {
   const [hasChanges, setHasChanges] = useState(false);

   const editor = useEditor({
      extensions: [
         StarterKit,
         Underline,
         TextAlign.configure({
            types: ["heading", "paragraph"],
         }),
         Highlight.configure({
            multicolor: true,
         }),
         Link.configure({
            openOnClick: false,
         }),
         Image,
         Table.configure({
            resizable: true,
         }),
         TableRow,
         TableHeader,
         TableCell,
         TextStyle,
         Color,
      ],
      content,
      editorProps: {
         attributes: {
            class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
         },
      },
      onUpdate: () => {
         setHasChanges(true);
      },
   });

   useEffect(() => {
      if (editor && content !== editor.getHTML()) {
         editor.commands.setContent(content);
         setHasChanges(false);
      }
   }, [content, editor]);

   const handleSave = () => {
      if (!editor) return;

      const editorContent = editor.getHTML();
      onSave(editorContent);
      setHasChanges(false);
   };

   const handleCancel = () => {
      if (editor) {
         editor.commands.setContent(content);
      }
      setHasChanges(false);
      onCancel();
   };

   if (!editor) {
      return <div>Loading editor...</div>;
   }

   return (
      <Card className="h-fit">
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                     Edit Generated Content
                     {hasChanges && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                           Unsaved changes
                        </span>
                     )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                     Make your edits and save to update the preview. Changes are
                     kept locally for export.
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <Button
                     variant="outline"
                     size="icon"
                     onClick={handleCancel}
                     className="gap-2"
                  >
                     <X className="h-4 w-4" />
                  </Button>
                  <Button
                     size="icon"
                     onClick={handleSave}
                     disabled={!hasChanges}
                  >
                     <Check className="h-4 w-4" />
                  </Button>
               </div>
            </div>
         </CardHeader>
         <CardContent>
            <div className="border rounded-lg overflow-hidden">
               <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
                  <Button
                     variant={editor.isActive("bold") ? "default" : "ghost"}
                     size="sm"
                     onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                     <strong>B</strong>
                  </Button>
                  <Button
                     variant={editor.isActive("italic") ? "default" : "ghost"}
                     size="sm"
                     onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                     <em>I</em>
                  </Button>
                  <Button
                     variant={
                        editor.isActive("underline") ? "default" : "ghost"
                     }
                     size="sm"
                     onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                     }
                  >
                     <u>U</u>
                  </Button>
                  <Button
                     variant={editor.isActive("strike") ? "default" : "ghost"}
                     size="sm"
                     onClick={() => editor.chain().focus().toggleStrike().run()}
                  >
                     <s>S</s>
                  </Button>

                  <div className="w-px h-6 bg-border mx-1" />

                  <Button
                     variant={
                        editor.isActive("heading", { level: 1 })
                           ? "default"
                           : "ghost"
                     }
                     size="sm"
                     onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                     }
                  >
                     H1
                  </Button>
                  <Button
                     variant={
                        editor.isActive("heading", { level: 2 })
                           ? "default"
                           : "ghost"
                     }
                     size="sm"
                     onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                     }
                  >
                     H2
                  </Button>
                  <Button
                     variant={
                        editor.isActive("heading", { level: 3 })
                           ? "default"
                           : "ghost"
                     }
                     size="sm"
                     onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                     }
                  >
                     H3
                  </Button>

                  <div className="w-px h-6 bg-border mx-1" />

                  <Button
                     variant={
                        editor.isActive("bulletList") ? "default" : "ghost"
                     }
                     size="sm"
                     onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                     }
                  >
                     •
                  </Button>
                  <Button
                     variant={
                        editor.isActive("orderedList") ? "default" : "ghost"
                     }
                     size="sm"
                     onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                     }
                  >
                     1.
                  </Button>

                  <div className="w-px h-6 bg-border mx-1" />

                  <Button
                     variant={
                        editor.isActive("blockquote") ? "default" : "ghost"
                     }
                     size="sm"
                     onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                     }
                  >
                     "
                  </Button>
                  <Button
                     variant={editor.isActive("code") ? "default" : "ghost"}
                     size="sm"
                     onClick={() => editor.chain().focus().toggleCode().run()}
                  >
                     &lt;&gt;
                  </Button>

                  <div className="w-px h-6 bg-border mx-1" />

                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => editor.chain().focus().undo().run()}
                     disabled={!editor.can().undo()}
                  >
                     ↶
                  </Button>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => editor.chain().focus().redo().run()}
                     disabled={!editor.can().redo()}
                  >
                     ↷
                  </Button>
               </div>

               <EditorContent editor={editor} className="min-h-[400px]" />
            </div>
         </CardContent>
      </Card>
   );
}
