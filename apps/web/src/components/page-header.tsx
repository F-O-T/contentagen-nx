import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { Check, Pencil, X } from "lucide-react";
import {
   type ReactNode,
   useCallback,
   useEffect,
   useRef,
   useState,
} from "react";
import { ContextPanelHeaderActions } from "@/features/context-panel/context-panel-header-actions";
import { useContextPanel } from "@/features/context-panel/use-context-panel";

export interface PageHeaderProps {
   title: string;
   description?: ReactNode;
   editable?: boolean;
   onTitleChange?: (value: string) => void;
   onDescriptionChange?: (value: string) => void;
   titlePlaceholder?: string;
   descriptionPlaceholder?: string;
   actions?: ReactNode;
   className?: string;
}

function InlineEditableText({
   value,
   placeholder,
   onSave,
   className,
   textClassName,
}: {
   value: string;
   placeholder?: string;
   onSave: (value: string) => void;
   className?: string;
   textClassName?: string;
}) {
   const [isEditing, setIsEditing] = useState(false);
   const [draft, setDraft] = useState(value);
   const inputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      if (isEditing) {
         inputRef.current?.focus();
         inputRef.current?.select();
      }
   }, [isEditing]);

   const startEditing = useCallback(() => {
      setDraft(value);
      setIsEditing(true);
   }, [value]);

   const commit = useCallback(() => {
      setIsEditing(false);
      const trimmed = draft.trim();
      if (trimmed !== value) {
         onSave(trimmed);
      }
   }, [draft, value, onSave]);

   const discard = useCallback(() => {
      setDraft(value);
      setIsEditing(false);
   }, [value]);

   const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
         if (e.key === "Enter") {
            e.preventDefault();
            commit();
         } else if (e.key === "Escape") {
            discard();
         }
      },
      [commit, discard],
   );

   if (isEditing) {
      return (
         <div className={cn("flex items-center gap-1.5", textClassName)}>
            <Input
               className="h-auto text-[length:inherit] font-[inherit] leading-[inherit]"
               onBlur={commit}
               onChange={(e) => setDraft(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder={placeholder}
               ref={inputRef}
               value={draft}
            />
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     onClick={commit}
                     size="icon-sm"
                     type="button"
                     variant="outline"
                  >
                     <Check />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Salvar</TooltipContent>
            </Tooltip>
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     onClick={discard}
                     onMouseDown={(e) => e.preventDefault()}
                     size="icon-sm"
                     type="button"
                     variant="outline"
                  >
                     <X />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Cancelar</TooltipContent>
            </Tooltip>
         </div>
      );
   }

   return (
      <div className={cn("flex items-center gap-1.5", className)}>
         <span
            className={cn(
               "truncate",
               !value && "text-muted-foreground",
               textClassName,
            )}
         >
            {value || placeholder}
         </span>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  onClick={startEditing}
                  size="icon-sm"
                  type="button"
                  variant="outline"
               >
                  <Pencil />
               </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
         </Tooltip>
      </div>
   );
}

const TITLE_CLASS = "text-2xl font-semibold font-serif leading-tight";
const DESCRIPTION_CLASS = "text-base text-muted-foreground font-sans";

export function PageHeader({
   title,
   description,
   editable = false,
   onTitleChange,
   onDescriptionChange,
   titlePlaceholder = "Título",
   descriptionPlaceholder = "Adicionar descrição...",
   actions,
   className,
}: PageHeaderProps) {
   const { isOpen } = useContextPanel();
   const hasEditableDescription = editable && onDescriptionChange != null;
   const showDescription = description != null || hasEditableDescription;

   return (
      <header
         className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
            className,
         )}
      >
         <div className="flex items-start min-w-0 flex-1 max-w-2xl">
            <div
               className={cn(
                  "flex flex-col min-w-0",
                  showDescription && "gap-1.5",
               )}
            >
               {editable && onTitleChange ? (
                  <InlineEditableText
                     onSave={onTitleChange}
                     placeholder={titlePlaceholder}
                     textClassName={TITLE_CLASS}
                     value={title}
                  />
               ) : (
                  <h1 className={TITLE_CLASS}>{title}</h1>
               )}
               {hasEditableDescription ? (
                  <InlineEditableText
                     onSave={onDescriptionChange}
                     placeholder={descriptionPlaceholder}
                     textClassName={DESCRIPTION_CLASS}
                     value={typeof description === "string" ? description : ""}
                  />
               ) : description != null ? (
                  <p className={cn(DESCRIPTION_CLASS, "leading-relaxed")}>
                     {description}
                  </p>
               ) : null}
            </div>
         </div>
         <div className="flex items-center gap-2 shrink-0">
            {actions}
            {!isOpen && <ContextPanelHeaderActions />}
         </div>
      </header>
   );
}
