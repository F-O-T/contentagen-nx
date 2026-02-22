"use client";

import { SlashInputPlugin, SlashPlugin } from "@platejs/slash-command/react";
import type { SlateEditor } from "platejs";
import { KEYS } from "platejs";
import { SlashInputElement } from "../ui/slash-input-node";

function isInsideCodeBlock(editor: SlateEditor): boolean {
   const codeBlockEntry = editor.api.above({
      match: { type: KEYS.codeBlock },
   });
   return !!codeBlockEntry;
}

export const SlashKit = [
   SlashPlugin.configure({
      options: {
         trigger: "/",
         triggerPreviousCharPattern: /^\s?$/,
         triggerQuery: (editor) => !isInsideCodeBlock(editor),
      },
   }),
   SlashInputPlugin.withComponent(SlashInputElement),
] as const;
