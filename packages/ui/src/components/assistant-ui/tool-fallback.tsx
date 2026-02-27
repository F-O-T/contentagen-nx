"use client";

import {
   type ToolCallMessagePartComponent,
   type ToolCallMessagePartStatus,
   useScrollLock,
} from "@assistant-ui/react";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { cn } from "@packages/ui/lib/utils";
import { TOOL_DISPLAY_LABELS } from "./tool-display-labels";
import {
   AlertCircleIcon,
   CheckIcon,
   ChevronDownIcon,
   LoaderIcon,
   XCircleIcon,
} from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";

const ANIMATION_DURATION = 200;

export type ToolFallbackRootProps = Omit<
   React.ComponentProps<typeof Collapsible>,
   "open" | "onOpenChange"
> & {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   defaultOpen?: boolean;
};

function ToolFallbackRoot({
   className,
   open: controlledOpen,
   onOpenChange: controlledOnOpenChange,
   defaultOpen = false,
   children,
   ...props
}: ToolFallbackRootProps) {
   const collapsibleRef = useRef<HTMLDivElement>(null);
   const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
   const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

   const isControlled = controlledOpen !== undefined;
   const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

   const handleOpenChange = useCallback(
      (open: boolean) => {
         if (!open) {
            lockScroll();
         }
         if (!isControlled) {
            setUncontrolledOpen(open);
         }
         controlledOnOpenChange?.(open);
      },
      [lockScroll, isControlled, controlledOnOpenChange],
   );

   return (
      <Collapsible
         className={cn(
            "aui-tool-fallback-root group/tool-fallback-root w-full rounded-lg border py-3",
            className,
         )}
         data-slot="tool-fallback-root"
         onOpenChange={handleOpenChange}
         open={isOpen}
         ref={collapsibleRef}
         style={
            {
               "--animation-duration": `${ANIMATION_DURATION}ms`,
            } as React.CSSProperties
         }
         {...props}
      >
         {children}
      </Collapsible>
   );
}

type ToolStatus = ToolCallMessagePartStatus["type"];

const statusIconMap: Record<ToolStatus, React.ElementType> = {
   running: LoaderIcon,
   complete: CheckIcon,
   incomplete: XCircleIcon,
   "requires-action": AlertCircleIcon,
};

function ToolFallbackTrigger({
   toolName,
   status,
   className,
   ...props
}: React.ComponentProps<typeof CollapsibleTrigger> & {
   toolName: string;
   status?: ToolCallMessagePartStatus;
}) {
   const statusType = status?.type ?? "complete";
   const isRunning = statusType === "running";
   const isCancelled =
      status?.type === "incomplete" && status.reason === "cancelled";

   const Icon = statusIconMap[statusType];
   const label = isCancelled ? "Ferramenta cancelada" : "Ferramenta usada";
   const displayName = TOOL_DISPLAY_LABELS[toolName] ?? toolName;

   return (
      <CollapsibleTrigger
         className={cn(
            "aui-tool-fallback-trigger group/trigger flex w-full items-center gap-2 px-4 text-sm transition-colors",
            className,
         )}
         data-slot="tool-fallback-trigger"
         {...props}
      >
         <Icon
            className={cn(
               "aui-tool-fallback-trigger-icon size-4 shrink-0",
               isCancelled && "text-muted-foreground",
               isRunning && "animate-spin",
            )}
            data-slot="tool-fallback-trigger-icon"
         />
         <span
            className={cn(
               "aui-tool-fallback-trigger-label-wrapper relative inline-block grow text-left leading-none",
               isCancelled && "text-muted-foreground line-through",
            )}
            data-slot="tool-fallback-trigger-label"
         >
            <span>
               {label}: <b>{displayName}</b>
            </span>
            {isRunning && (
               <span
                  aria-hidden
                  className="aui-tool-fallback-trigger-shimmer shimmer pointer-events-none absolute inset-0 motion-reduce:animate-none"
                  data-slot="tool-fallback-trigger-shimmer"
               >
                  {label}: <b>{displayName}</b>
               </span>
            )}
         </span>
         <ChevronDownIcon
            className={cn(
               "aui-tool-fallback-trigger-chevron size-4 shrink-0",
               "transition-transform duration-(--animation-duration) ease-out",
               "group-data-[state=closed]/trigger:-rotate-90",
               "group-data-[state=open]/trigger:rotate-0",
            )}
            data-slot="tool-fallback-trigger-chevron"
         />
      </CollapsibleTrigger>
   );
}

function ToolFallbackContent({
   className,
   children,
   ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
   return (
      <CollapsibleContent
         className={cn(
            "aui-tool-fallback-content relative overflow-hidden text-sm outline-none",
            "group/collapsible-content ease-out",
            "data-[state=closed]:animate-collapsible-up",
            "data-[state=open]:animate-collapsible-down",
            "data-[state=closed]:fill-mode-forwards",
            "data-[state=closed]:pointer-events-none",
            "data-[state=open]:duration-(--animation-duration)",
            "data-[state=closed]:duration-(--animation-duration)",
            className,
         )}
         data-slot="tool-fallback-content"
         {...props}
      >
         <div className="mt-3 flex flex-col gap-2 border-t pt-2">
            {children}
         </div>
      </CollapsibleContent>
   );
}

function ToolFallbackArgs({
   argsText,
   className,
   ...props
}: React.ComponentProps<"div"> & {
   argsText?: string;
}) {
   if (!argsText) return null;

   return (
      <div
         className={cn("aui-tool-fallback-args px-4", className)}
         data-slot="tool-fallback-args"
         {...props}
      >
         <pre className="aui-tool-fallback-args-value whitespace-pre-wrap">
            {argsText}
         </pre>
      </div>
   );
}

function ToolFallbackResult({
   result,
   className,
   ...props
}: React.ComponentProps<"div"> & {
   result?: unknown;
}) {
   if (result === undefined) return null;

   return (
      <div
         className={cn(
            "aui-tool-fallback-result border-t border-dashed px-4 pt-2",
            className,
         )}
         data-slot="tool-fallback-result"
         {...props}
      >
         <p className="aui-tool-fallback-result-header font-semibold">
            Result:
         </p>
         <pre className="aui-tool-fallback-result-content whitespace-pre-wrap">
            {typeof result === "string"
               ? result
               : JSON.stringify(result, null, 2)}
         </pre>
      </div>
   );
}

function ToolFallbackError({
   status,
   className,
   ...props
}: React.ComponentProps<"div"> & {
   status?: ToolCallMessagePartStatus;
}) {
   if (status?.type !== "incomplete") return null;

   const error = status.error;
   const errorText = error
      ? typeof error === "string"
         ? error
         : JSON.stringify(error)
      : null;

   if (!errorText) return null;

   const isCancelled = status.reason === "cancelled";
   const headerText = isCancelled ? "Motivo do cancelamento:" : "Erro:";

   return (
      <div
         className={cn("aui-tool-fallback-error px-4", className)}
         data-slot="tool-fallback-error"
         {...props}
      >
         <p className="aui-tool-fallback-error-header font-semibold text-muted-foreground">
            {headerText}
         </p>
         <p className="aui-tool-fallback-error-reason text-muted-foreground">
            {errorText}
         </p>
      </div>
   );
}

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
   toolName,
   argsText,
   result,
   status,
}) => {
   const isCancelled =
      status?.type === "incomplete" && status.reason === "cancelled";

   return (
      <ToolFallbackRoot
         className={cn(isCancelled && "border-muted-foreground/30 bg-muted/30")}
      >
         <ToolFallbackTrigger status={status} toolName={toolName} />
         <ToolFallbackContent>
            <ToolFallbackError status={status} />
            <ToolFallbackArgs
               argsText={argsText}
               className={cn(isCancelled && "opacity-60")}
            />
            {!isCancelled && <ToolFallbackResult result={result} />}
         </ToolFallbackContent>
      </ToolFallbackRoot>
   );
};

const ToolFallback = memo(
   ToolFallbackImpl,
) as unknown as ToolCallMessagePartComponent & {
   Root: typeof ToolFallbackRoot;
   Trigger: typeof ToolFallbackTrigger;
   Content: typeof ToolFallbackContent;
   Args: typeof ToolFallbackArgs;
   Result: typeof ToolFallbackResult;
   Error: typeof ToolFallbackError;
};

ToolFallback.displayName = "ToolFallback";
ToolFallback.Root = ToolFallbackRoot;
ToolFallback.Trigger = ToolFallbackTrigger;
ToolFallback.Content = ToolFallbackContent;
ToolFallback.Args = ToolFallbackArgs;
ToolFallback.Result = ToolFallbackResult;
ToolFallback.Error = ToolFallbackError;

export {
   ToolFallback,
   ToolFallbackRoot,
   ToolFallbackTrigger,
   ToolFallbackContent,
   ToolFallbackArgs,
   ToolFallbackResult,
   ToolFallbackError,
};
