import { cn } from "@packages/ui/lib/utils";
import { Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface InlineEditableTextProps {
   value: string;
   placeholder?: string;
   onSave: (value: string) => void;
   className?: string;
   inputClassName?: string;
}

export function InlineEditableText({
   value,
   placeholder,
   onSave,
   className,
   inputClassName,
}: InlineEditableTextProps) {
   const [isEditing, setIsEditing] = useState(false);
   const [editValue, setEditValue] = useState(value);
   const inputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      setEditValue(value);
   }, [value]);

   useEffect(() => {
      if (isEditing) {
         inputRef.current?.focus();
         inputRef.current?.select();
      }
   }, [isEditing]);

   const handleSave = useCallback(() => {
      setIsEditing(false);
      const trimmed = editValue.trim();
      if (trimmed !== value) {
         onSave(trimmed);
      }
   }, [editValue, value, onSave]);

   const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
         if (e.key === "Enter") {
            handleSave();
         } else if (e.key === "Escape") {
            setEditValue(value);
            setIsEditing(false);
         }
      },
      [handleSave, value],
   );

   if (isEditing) {
      return (
         <input
            className={cn(
               "w-full rounded-md border border-border bg-background px-2 py-1 outline-none ring-1 ring-ring",
               inputClassName ?? className,
            )}
            onBlur={handleSave}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={inputRef}
            value={editValue}
         />
      );
   }

   return (
      <button
         className={cn(
            "group/edit inline-flex items-center gap-1.5 text-left cursor-text min-w-0",
            className,
         )}
         onClick={() => setIsEditing(true)}
         type="button"
      >
         <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
         </span>
         <Pencil className="size-3 text-muted-foreground shrink-0 cursor-pointer" />
      </button>
   );
}
