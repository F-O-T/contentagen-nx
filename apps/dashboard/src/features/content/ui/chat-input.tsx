import { Button } from "@packages/ui/components/button";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import { Send, Square } from "lucide-react";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import {
   type ChatCommand,
   type MentionCommand,
   type SlashCommand,
   useChatCommands,
} from "../hooks/use-chat-commands";
import { replaceCommand, useCommandParser } from "../hooks/use-command-parser";
import {
   ChatCommandSuggestions,
   type ChatCommandSuggestionsRef,
} from "./chat-command-suggestions";

interface ChatInputProps {
   onSend: (message: string) => void;
   onCancel?: () => void;
   isLoading?: boolean;
   disabled?: boolean;
   placeholder?: string;
}

export function ChatInput({
   onSend,
   onCancel,
   isLoading = false,
   disabled = false,
   placeholder = "Type a message...",
}: ChatInputProps) {
   const [value, setValue] = useState("");
   const [cursorPosition, setCursorPosition] = useState(0);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const suggestionsRef = useRef<ChatCommandSuggestionsRef>(null);

   // Parse for commands
   const commandMatch = useCommandParser(value, cursorPosition);

   // Get available commands
   const { slashCommands, mentionCommands, filterCommands } =
      useChatCommands(onSend);

   const handleSubmit = useCallback(() => {
      const trimmed = value.trim();
      if (!trimmed || isLoading || disabled) return;

      onSend(trimmed);
      setValue("");
      setCursorPosition(0);

      // Reset textarea height
      if (textareaRef.current) {
         textareaRef.current.style.height = "auto";
      }
   }, [value, isLoading, disabled, onSend]);

   const handleCommandSelect = useCallback(
      (command: ChatCommand) => {
         if (!commandMatch) return;

         if (commandMatch.type === "slash") {
            // Execute slash command and clear input
            (command as SlashCommand).handler();
            const newValue = replaceCommand(value, commandMatch, "");
            setValue(newValue);
            setCursorPosition(commandMatch.startIndex);
         } else {
            // Insert mention value
            const mentionValue = (command as MentionCommand).getValue();
            const newValue = replaceCommand(value, commandMatch, mentionValue);
            setValue(newValue);
            setCursorPosition(
               commandMatch.startIndex + mentionValue.length + 1,
            );
         }

         // Focus textarea
         textareaRef.current?.focus();
      },
      [commandMatch, value],
   );

   const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
         // Handle command suggestions navigation
         if (commandMatch) {
            if (e.key === "ArrowUp") {
               e.preventDefault();
               suggestionsRef.current?.moveUp();
               return;
            }
            if (e.key === "ArrowDown") {
               e.preventDefault();
               suggestionsRef.current?.moveDown();
               return;
            }
            if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
               e.preventDefault();
               suggestionsRef.current?.selectCurrent();
               return;
            }
            if (e.key === "Escape") {
               e.preventDefault();
               // Clear command by adding a space
               setValue(`${value} `);
               setCursorPosition(cursorPosition + 1);
               return;
            }
         }

         // Enter to send (without shift)
         if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
         }
      },
      [commandMatch, handleSubmit, value, cursorPosition],
   );

   // Track cursor position
   const handleSelect = useCallback(() => {
      if (textareaRef.current) {
         setCursorPosition(textareaRef.current.selectionStart);
      }
   }, []);

   // Auto-resize textarea
   const handleInput = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
   }, []);

   const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
         setValue(e.target.value);
         setCursorPosition(e.target.selectionStart);
         handleInput();
      },
      [handleInput],
   );

   const hasValue = value.trim().length > 0;

   return (
      <div className="relative">
         {/* Command suggestions popover */}
         {commandMatch && (
            <ChatCommandSuggestions
               filterCommands={filterCommands}
               mentionCommands={mentionCommands}
               onSelect={handleCommandSelect}
               query={commandMatch.query}
               ref={suggestionsRef}
               slashCommands={slashCommands}
               type={commandMatch.type!}
            />
         )}

         <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-2">
            <Textarea
               className="min-h-[60px] max-h-[150px] resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
               disabled={disabled}
               onChange={handleChange}
               onClick={handleSelect}
               onKeyDown={handleKeyDown}
               onSelect={handleSelect}
               placeholder={placeholder}
               ref={textareaRef}
               rows={2}
               value={value}
            />

            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  {/* Mode and model selectors removed - mode shown in tab header */}
               </div>

               {isLoading ? (
                  <Button
                     className="h-7 gap-1.5 text-xs"
                     onClick={onCancel}
                     size="sm"
                     variant="ghost"
                  >
                     <Square className="size-3" />
                     Stop
                  </Button>
               ) : (
                  <Button
                     className={cn(
                        "h-7 gap-1.5 text-xs transition-opacity",
                        !hasValue && "opacity-50",
                     )}
                     disabled={!hasValue || disabled}
                     onClick={handleSubmit}
                     size="sm"
                  >
                     <Send className="size-3" />
                     Send
                  </Button>
               )}
            </div>
         </div>
      </div>
   );
}
