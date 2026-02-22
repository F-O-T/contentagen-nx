"use client";

import {
   ContextMenu,
   ContextMenuContent,
   ContextMenuItem,
   ContextMenuSeparator,
   ContextMenuTrigger,
} from "@packages/ui/components/context-menu";
import { AIChatPlugin } from "@platejs/ai/react";
import {
   BlockMenuPlugin,
   duplicateBlockSelectionNodes,
   removeBlockSelectionNodes,
} from "@platejs/selection/react";
import { Copy, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { useEditorPlugin, useEditorRef } from "platejs/react";
import type React from "react";

interface BlockContextMenuProps {
   children: React.ReactNode;
}

export function BlockContextMenu({ children }: BlockContextMenuProps) {
   const editor = useEditorRef();
   const { api: blockMenuApi } = useEditorPlugin(BlockMenuPlugin);

   const handleDuplicate = () => {
      duplicateBlockSelectionNodes(editor);
      blockMenuApi.blockMenu.hide();
   };

   const handleDelete = () => {
      removeBlockSelectionNodes(editor);
      blockMenuApi.blockMenu.hide();
   };

   const handleAIAction = (prompt: string) => {
      editor.getApi(AIChatPlugin).aiChat.show();
      editor.getApi(AIChatPlugin).aiChat.submit(prompt, { mode: "chat" });
      blockMenuApi.blockMenu.hide();
   };

   return (
      <ContextMenu>
         <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
         <ContextMenuContent>
            <ContextMenuItem onClick={handleDuplicate}>
               <Copy className="mr-2 size-4" />
               Duplicar bloco
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDelete} variant="destructive">
               <Trash2 className="mr-2 size-4" />
               Deletar bloco
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
               onClick={() => handleAIAction("Melhore este bloco de conteúdo")}
            >
               <WandSparkles className="mr-2 size-4" />
               Melhorar com IA
            </ContextMenuItem>
            <ContextMenuItem
               onClick={() =>
                  handleAIAction(
                     "Expanda este bloco de conteúdo com mais detalhes",
                  )
               }
            >
               <Sparkles className="mr-2 size-4" />
               Expandir com IA
            </ContextMenuItem>
            <ContextMenuItem
               onClick={() =>
                  handleAIAction(
                     "Resuma este bloco de conteúdo de forma concisa",
                  )
               }
            >
               <Sparkles className="mr-2 size-4" />
               Resumir com IA
            </ContextMenuItem>
         </ContextMenuContent>
      </ContextMenu>
   );
}
