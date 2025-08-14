import {
   EditorContent,
   useEditor,
   type EditorOptions,
   type Storage,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import type React from "react";
import { useEffect, useMemo } from "react";
import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";

export interface TiptapEditorProps {
   value: string;
   onChange: (value: string) => void;
   onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
   name?: string;
   id?: string;
   placeholder?: string;
   className?: string;
   minHeight?: string;
   editorOptions?: Partial<EditorOptions>;
   error?: boolean;
}
type MDStorage = Storage & {
   markdown?: MarkdownStorage;
};
export function TiptapEditor({
   value,
   onChange,
   onBlur,
   name,
   id,
   placeholder,
   className = "",
   minHeight = "200px",
   editorOptions = {},
   error = false,
}: TiptapEditorProps) {
   const editor = useEditor({
      immediatelyRender: true,
      extensions: [StarterKit, Markdown],
      content: value,
      editorProps: {
         attributes: {
            class: `prose prose-sm max-w-none focus:outline-none p-4 ${className} ${
               error ? "border-destructive" : ""
            }`,
            style: `min-height: ${minHeight};`,
         },
      },
      onUpdate: ({ editor }) => {
         const markdownStorage = (editor.storage as MDStorage).markdown;
         if (markdownStorage?.getMarkdown) {
            onChange(markdownStorage.getMarkdown());
         } else {
            onChange(editor.getText()); // fallback to plain text
         }
      },
      ...editorOptions,
   });

   // Sync editor content if value changes externally
   useEffect(() => {
      if (editor && value !== editor.getText()) {
         editor.commands.setContent(value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [value, editor]);

   const toolbarButtons = useMemo(
      () => [
         {
            key: "bold",
            label: <strong>B</strong>,
            isActive: () => editor?.isActive("bold"),
            onClick: () => editor?.chain().focus().toggleBold().run(),
            variant: editor?.isActive("bold") ? "secondary" : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         {
            key: "italic",
            label: <em>I</em>,
            isActive: () => editor?.isActive("italic") ?? false,
            onClick: () => editor?.chain().focus().toggleItalic().run(),
            variant: editor?.isActive("italic") ? "secondary" : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         {
            key: "strike",
            label: <s>S</s>,
            isActive: () => editor?.isActive("strike") ?? false,
            onClick: () => editor?.chain().focus().toggleStrike().run(),
            variant: editor?.isActive("strike") ? "secondary" : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         { key: "sep-1", separator: true },
         {
            key: "heading-1",
            label: "H1",
            isActive: () => editor?.isActive("heading", { level: 1 }) ?? false,
            onClick: () =>
               editor?.chain().focus().toggleHeading({ level: 1 }).run(),
            variant: editor?.isActive("heading", { level: 1 })
               ? "secondary"
               : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         {
            key: "heading-2",
            label: "H2",
            isActive: () => editor?.isActive("heading", { level: 2 }) ?? false,
            onClick: () =>
               editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            variant: editor?.isActive("heading", { level: 2 })
               ? "secondary"
               : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         {
            key: "heading-3",
            label: "H3",
            isActive: () => editor?.isActive("heading", { level: 3 }) ?? false,
            onClick: () =>
               editor?.chain().focus().toggleHeading({ level: 3 }).run(),
            variant: editor?.isActive("heading", { level: 3 })
               ? "secondary"
               : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         { key: "sep-2", separator: true },
         {
            key: "bulletList",
            label: "•",
            isActive: () => editor?.isActive("bulletList") ?? false,
            onClick: () => editor?.chain().focus().toggleBulletList().run(),
            variant: editor?.isActive("bulletList") ? "secondary" : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         {
            key: "orderedList",
            label: "1.",
            isActive: () => editor?.isActive("orderedList") ?? false,
            onClick: () => editor?.chain().focus().toggleOrderedList().run(),
            variant: editor?.isActive("orderedList") ? "secondary" : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         { key: "sep-3", separator: true },
         {
            key: "blockquote",
            label: '"',
            isActive: () => editor?.isActive("blockquote") ?? false,
            onClick: () => editor?.chain().focus().toggleBlockquote().run(),
            variant: editor?.isActive("blockquote") ? "secondary" : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         {
            key: "code",
            label: "<>",
            isActive: () => editor?.isActive("code") ?? false,
            onClick: () => editor?.chain().focus().toggleCode().run(),
            variant: editor?.isActive("code") ? "secondary" : "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         { key: "sep-4", separator: true },
         {
            key: "undo",
            label: "↶",
            isActive: () => false,
            onClick: () => editor?.chain().focus().undo().run(),
            disabled: !editor?.can().undo(),
            variant: "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
         {
            key: "redo",
            label: "↷",
            isActive: () => false,
            onClick: () => editor?.chain().focus().redo().run(),
            disabled: !editor?.can().redo(),
            variant: "ghost",
            size: "sm",
            type: "button",
            as: Button,
         },
      ],
      [editor],
   );

   if (!editor) return <div>Loading editor...</div>;

   return (
      <div
         className={`rounded-lg border-2 ${error ? "border-destructive" : "border-primary/30"} bg-muted/70`}
      >
         <div className="p-2 flex flex-wrap items-center gap-1 bg-primary/10">
            {toolbarButtons.map((btn) =>
               btn.separator ? (
                  <div key={btn.key} className="w-px h-6 bg-primary mx-1" />
               ) : (
                  <Button
                     key={btn.key}
                     type={
                        btn.type as "button" | "submit" | "reset" | undefined
                     }
                     variant={
                        btn.variant as
                           | "default"
                           | "link"
                           | "outline"
                           | "destructive"
                           | "ghost"
                           | "secondary"
                           | null
                           | undefined
                     }
                     size={
                        btn.size as
                           | "default"
                           | "icon"
                           | "lg"
                           | "sm"
                           | null
                           | undefined
                     }
                     onClick={btn.onClick}
                     disabled={btn.disabled}
                  >
                     {btn.label}
                  </Button>
               ),
            )}
         </div>
         <div className=" relative rounded-b-lg" style={{ minHeight }}>
            <EditorContent
               editor={editor}
               id={id}
               data-name={name}
               data-placeholder={placeholder}
               onBlur={onBlur}
            />
            {editor.isEmpty && placeholder && (
               <div
                  className="absolute top-0 left-0 w-full h-full flex flex-col gap-2 items-start p-4 text-muted-foreground pointer-events-none select-none"
                  style={{ zIndex: 1 }}
               >
                  <span>{placeholder}</span>
                  <Separator className="my-2 w-full" />
               </div>
            )}
         </div>
      </div>
   );
}
