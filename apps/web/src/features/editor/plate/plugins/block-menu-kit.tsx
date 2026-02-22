import {
   BlockMenuPlugin,
   BlockSelectionPlugin,
} from "@platejs/selection/react";
import { BlockContextMenu } from "../ui/block-context-menu";

export const BlockMenuKit = [
   BlockSelectionPlugin.configure({
      options: { enableContextMenu: true },
   }),
   BlockMenuPlugin.configure({
      render: { aboveEditable: BlockContextMenu },
   }),
] as const;
