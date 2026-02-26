"use client";

import {
   ThreadListItemPrimitive,
   ThreadListPrimitive,
   useAuiState,
} from "@assistant-ui/react";
import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { MessageSquarePlusIcon, Trash2Icon } from "lucide-react";
import type { FC, ReactNode } from "react";

export interface ThreadListProps {
   welcomeIconUrl?: string;
   className?: string;
   /**
    * Optional slot to replace the default "Nova conversa" button.
    * Use this to inject a router Link from the app layer.
    */
   newThreadTrigger?: ReactNode;
   /**
    * Optional render function for thread item trigger.
    * Receives the thread's externalId and title, plus the default children.
    * If not provided, the default button trigger is used.
    *
    * Use this to inject routing (e.g. TanStack Link) from the app layer.
    */
   renderThreadTrigger?: (props: {
      externalId: string | undefined;
      title: string | undefined;
      children: ReactNode;
   }) => ReactNode;
}

export const ThreadList: FC<ThreadListProps> = ({
   welcomeIconUrl,
   className,
   newThreadTrigger,
   renderThreadTrigger,
}) => {
   return (
      <ThreadListPrimitive.Root
         className={cn(
            "flex h-full flex-col gap-1 overflow-y-auto px-2 py-2",
            className,
         )}
      >
         {newThreadTrigger ?? <ThreadListNew welcomeIconUrl={welcomeIconUrl} />}

         <div className="mt-2">
            <p className="mb-1 px-2 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide">
               Conversas
            </p>
            <ThreadListPrimitive.Items
               components={{
                  ThreadListItem: (props) => (
                     <ThreadListItemComponent
                        {...props}
                        renderThreadTrigger={renderThreadTrigger}
                     />
                  ),
               }}
            />
         </div>
      </ThreadListPrimitive.Root>
   );
};

const ThreadListNew: FC<{ welcomeIconUrl?: string }> = () => {
   return (
      <ThreadListPrimitive.New asChild>
         <Button
            className="flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium"
            variant="outline"
         >
            Nova conversa
            <MessageSquarePlusIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
         </Button>
      </ThreadListPrimitive.New>
   );
};

const ThreadListItemComponent: FC<{
   renderThreadTrigger?: ThreadListProps["renderThreadTrigger"];
}> = ({ renderThreadTrigger }) => {
   const title = useAuiState((s) => s.threadListItem.title);
   const externalId = useAuiState((s) => s.threadListItem.externalId);

   const triggerContent = (
      <span className="flex-1 truncate text-foreground/80">
         {title ?? "Nova conversa"}
      </span>
   );

   const trigger = (
      <ThreadListItemPrimitive.Trigger asChild>
         {renderThreadTrigger ? (
            renderThreadTrigger({
               externalId,
               title: title ?? undefined,
               children: triggerContent,
            })
         ) : (
            <button
               className="flex min-w-0 flex-1 items-center gap-2 text-left"
               type="button"
            >
               {triggerContent}
            </button>
         )}
      </ThreadListItemPrimitive.Trigger>
   );

   return (
      <ThreadListItemPrimitive.Root
         className={cn(
            "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/60",
            "data-[active=true]:bg-accent/80 data-[active=true]:font-medium",
         )}
      >
         {trigger}

         <ThreadListItemPrimitive.Delete asChild>
            <button
               className="ml-auto shrink-0 rounded p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
               type="button"
            >
               <Trash2Icon className="size-3.5" />
               <span className="sr-only">Excluir conversa</span>
            </button>
         </ThreadListItemPrimitive.Delete>
      </ThreadListItemPrimitive.Root>
   );
};
