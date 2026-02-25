import {
   ComposerPrimitive,
   MessagePartPrimitive,
   MessagePrimitive,
   ThreadPrimitive,
} from "@assistant-ui/react";
import { ArrowUp } from "lucide-react";

import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";

function ThreadEmpty() {
   return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 gap-3 py-8">
         <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-2xl">✦</span>
            <h2 className="text-xl font-semibold">Arandu AI</h2>
            <p className="text-sm text-muted-foreground">
               Como posso te ajudar hoje?
            </p>
         </div>
      </div>
   );
}

function UserMessage() {
   return (
      <MessagePrimitive.Root className="flex justify-end w-full px-4 py-2">
         <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            <MessagePrimitive.Parts
               components={{
                  Text: ({ part }) => (
                     <MessagePartPrimitive.Text>
                        <span className="whitespace-pre-wrap break-words">
                           {part.text}
                        </span>
                     </MessagePartPrimitive.Text>
                  ),
               }}
            />
         </div>
      </MessagePrimitive.Root>
   );
}

function AssistantMessage() {
   return (
      <MessagePrimitive.Root className="flex justify-start w-full px-4 py-2">
         <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-foreground">
            <MessagePrimitive.Parts
               components={{
                  Text: ({ part }) => (
                     <MessagePartPrimitive.Text>
                        <span className="whitespace-pre-wrap break-words">
                           {part.text}
                        </span>
                     </MessagePartPrimitive.Text>
                  ),
               }}
            />
         </div>
      </MessagePrimitive.Root>
   );
}

function Composer() {
   return (
      <ComposerPrimitive.Root className="flex items-end gap-2 border-t bg-background px-4 py-3">
         <ComposerPrimitive.Input
            className={cn(
               "flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground",
               "focus:outline-none min-h-[40px] max-h-[200px] py-2",
               "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
            )}
            placeholder="Faça uma pergunta..."
            rows={1}
         />
         <ComposerPrimitive.Send asChild>
            <Button
               size="icon"
               className="h-8 w-8 shrink-0 rounded-full"
               aria-label="Enviar mensagem"
            >
               <ArrowUp className="size-4" />
            </Button>
         </ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
   );
}

function Thread() {
   return (
      <ThreadPrimitive.Root className="flex flex-col h-full bg-background">
         <ThreadPrimitive.Viewport className="flex flex-col flex-1 overflow-y-auto py-4">
            <ThreadPrimitive.Empty>
               <ThreadEmpty />
            </ThreadPrimitive.Empty>
            <ThreadPrimitive.Messages
               components={{
                  UserMessage,
                  AssistantMessage,
               }}
            />
         </ThreadPrimitive.Viewport>
         <Composer />
      </ThreadPrimitive.Root>
   );
}

export { Thread };
