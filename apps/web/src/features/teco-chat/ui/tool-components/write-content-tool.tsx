import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useEffect } from "react";
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
    const { args, status, addResult } = props;

    // biome-ignore lint/correctness/useExhaustiveDependencies: addResult identity is stable per tool call
    useEffect(() => {
      if (status.type === "running" && args.markdown) {
        editorContentStore.applyMarkdown(args.markdown);
        addResult({ success: true });
      }
    }, [args.markdown, status.type]);

    return <EditorTool {...(props as unknown as ToolCallMessagePartProps)} />;
  },
});
