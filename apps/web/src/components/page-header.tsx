import type { ReactNode } from "react";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";

export interface PageHeaderProps {
   title: string;
   description?: ReactNode;
   editable?: boolean;
   onTitleChange?: (value: string) => void;
   titlePlaceholder?: string;
   actions?: ReactNode;
   leading?: ReactNode;
}

const titleClassName = "text-2xl font-semibold font-serif leading-tight";

export function PageHeader({
   title,
   description,
   editable = false,
   onTitleChange,
   titlePlaceholder = "Título",
   actions,
   leading,
}: PageHeaderProps) {
   return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
         <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-2xl">
            <div className="flex items-center gap-3 min-w-0">
               {leading != null && <span className="flex-shrink-0">{leading}</span>}
               {editable && onTitleChange ? (
               <InlineEditableText
                  className={titleClassName}
                  onSave={onTitleChange}
                  placeholder={titlePlaceholder}
                  value={title}
               />
            ) : (
               <h1 className={titleClassName}>{title}</h1>
            )}
            </div>
            {description != null && (
               <div className="text-sm text-muted-foreground font-sans leading-relaxed">
                  {description}
               </div>
            )}
         </div>
         {actions != null && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
         )}
      </div>
   );
}
