import { EditorContent, useEditor, type EditorOptions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import React, { useEffect, useMemo } from "react";
import { Button } from "@packages/ui/components/button";

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
}

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
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 ${className}`,
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    ...editorOptions,
  });

  // Sync editor content if value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
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
        key: "underline",
        label: <u>U</u>,
        isActive: () => editor?.isActive("underline") ?? false,
        onClick: () => editor?.chain().focus().toggleUnderline().run(),
        variant: editor?.isActive("underline") ? "secondary" : "ghost",
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
  // Attach onBlur handler if provided
  React.useEffect(() => {
    if (!editor || !onBlur) return;
    const handler = () => {
      // Simulate a React synthetic event for compatibility
      const event = {
        target: {
          name,
          id,
          value: editor.getHTML(),
        },
        type: "blur",
      } as unknown as React.FocusEvent<HTMLDivElement>;
      onBlur(event);
    };
    editor.on("blur", handler);
    return () => {
      editor.off("blur", handler);
    };
  }, [editor, onBlur, name, id]);

  if (!editor) return <div>Loading editor...</div>;

  return (
    <div className="bg-muted rounded-lg">
      <div className="p-2 flex flex-wrap gap-4 bg-primary/10">
        {toolbarButtons.map((btn) =>
          btn.separator ? (
            <span key={btn.key} className="w-px h-6 bg-border mx-1" />
          ) : (
            <Button
              key={btn.key}
              type={btn.type as "button" | "submit" | "reset" | undefined}
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
                btn.size as "default" | "icon" | "lg" | "sm" | null | undefined
              }
              onClick={btn.onClick}
              disabled={btn.disabled}
            >
              {btn.label}
            </Button>
          ),
        )}
      </div>
      <div className="bg-muted " style={{ minHeight }}>
        {/* EditorContent is a div, so we add name, id, and placeholder as data attributes for accessibility/testing */}
        <EditorContent
          editor={editor}
          id={id}
          data-name={name}
          data-placeholder={placeholder}
        />
      </div>
      </div>
   );}




