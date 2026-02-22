import { BlockContextMenu } from "../ui/block-context-menu";
import {
	BlockMenuPlugin,
	BlockSelectionPlugin,
} from "@platejs/selection/react";

export const BlockMenuKit = [
	BlockSelectionPlugin.configure({
		options: { enableContextMenu: true },
	}),
	BlockMenuPlugin.configure({
		render: { aboveEditable: BlockContextMenu },
	}),
] as const;
