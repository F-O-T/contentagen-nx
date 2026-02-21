"use client";

import { CursorOverlay } from "@packages/ui/components/cursor-overlay";
import { CursorOverlayPlugin } from "@platejs/selection/react";

export const CursorOverlayKit = [
   CursorOverlayPlugin.configure({
      render: {
         afterEditable: () => <CursorOverlay />,
      },
   }),
];
