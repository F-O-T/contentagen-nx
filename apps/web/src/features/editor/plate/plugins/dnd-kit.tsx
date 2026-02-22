import { DndPlugin } from "@platejs/dnd";

export const DndKit = [
   DndPlugin.configure({
      options: { enableScroller: true },
   }),
] as const;
