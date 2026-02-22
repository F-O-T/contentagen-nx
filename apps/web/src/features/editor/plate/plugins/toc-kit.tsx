import { TocElement } from "@packages/ui/components/toc-node";
import { TocPlugin } from "@platejs/toc/react";

export const TocKit = [
   TocPlugin.configure({
      render: {
         node: TocElement,
      },
      options: {
         topOffset: 80,
         isScroll: true,
      },
   }),
] as const;
