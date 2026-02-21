"use client";

import { commentPlugin } from "@packages/ui/components/editor/plugins/comment-kit";

import { MessageSquareTextIcon } from "lucide-react";
import { useEditorRef } from "platejs/react";

import { ToolbarButton } from "./toolbar";

export function CommentToolbarButton() {
   const editor = useEditorRef();

   return (
      <ToolbarButton
         data-plate-prevent-overlay
         onClick={() => {
            editor.getTransforms(commentPlugin).comment.setDraft();
         }}
         tooltip="Comment"
      >
         <MessageSquareTextIcon />
      </ToolbarButton>
   );
}
