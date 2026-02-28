import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useEffect, useRef } from "react";
import { editorContentStore } from "@/features/editor/stores/editor-content-store";
import { EditorTool } from "./editor-tool";

type WriteContentArgs = { markdown: string };
type WriteContentResult = { success: boolean };

export const WriteContentToolUI = makeAssistantToolUI<
  WriteContentArgs,
  WriteContentResult
>({
  toolName: "write-content",
  render: (props: ToolCallMessagePartProps<WriteContentArgs, WriteContentResult>) => {
    const { args, status } = props;
    const hasApplied = useRef(false);

    useEffect(() => {
      if (status.type === "complete" && !hasApplied.current && args.markdown) {
        hasApplied.current = true;
        editorContentStore.applyMarkdown(args.markdown);
      }
    }, [args.markdown, status.type]);

    return <EditorTool {...(props as ToolCallMessagePartProps<any, any>)} />;
  },
});
