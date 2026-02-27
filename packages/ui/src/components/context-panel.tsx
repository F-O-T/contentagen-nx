import { cn } from "@packages/ui/lib/utils";
import type React from "react";

function ContextPanel({ className, ...props }: React.ComponentProps<"div">) {
   return (
      <div
         className={cn("flex h-full min-h-0 flex-col", className)}
         data-slot="context-panel"
         {...props}
      />
   );
}

function ContextPanelHeader({
   className,
   ...props
}: React.ComponentProps<"div">) {
   return (
      <div
         className={cn(
            "flex shrink-0 bg-background items-center gap-2 rounded-xl px-2 py-2 mx-2 my-4",
            className,
         )}
         data-slot="context-panel-header"
         {...props}
      />
   );
}

function ContextPanelTitle({
   className,
   ...props
}: React.ComponentProps<"div">) {
   return (
      <div
         className={cn("flex-1 text-sm font-semibold", className)}
         data-slot="context-panel-title"
         {...props}
      />
   );
}

function ContextPanelHeaderActions({
   className,
   ...props
}: React.ComponentProps<"div">) {
   return (
      <div
         className={cn("flex items-center gap-1", className)}
         data-slot="context-panel-header-actions"
         {...props}
      />
   );
}

function ContextPanelContent({
   className,
   ...props
}: React.ComponentProps<"div">) {
   return (
      <div
         className={cn("flex min-h-0 flex-1 flex-col overflow-auto", className)}
         data-slot="context-panel-content"
         {...props}
      />
   );
}

function ContextPanelFooter({
   className,
   ...props
}: React.ComponentProps<"div">) {
   return (
      <div
         className={cn("flex shrink-0 flex-col border-t p-2", className)}
         data-slot="context-panel-footer"
         {...props}
      />
   );
}

export {
   ContextPanel,
   ContextPanelContent,
   ContextPanelFooter,
   ContextPanelHeader,
   ContextPanelHeaderActions,
   ContextPanelTitle,
};
