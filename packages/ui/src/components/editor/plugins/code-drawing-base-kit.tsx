import { CodeDrawingElement } from "@packages/ui/components/code-drawing-node";
import { BaseCodeDrawingPlugin } from "@platejs/code-drawing";

export const BaseCodeDrawingKit = [
   BaseCodeDrawingPlugin.configure({
      node: { component: CodeDrawingElement },
   }),
];
