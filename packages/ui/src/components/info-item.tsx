import { cn } from "@packages/ui/lib/utils";
import type { ReactNode } from "react";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaTrigger,
} from "./credenza";
import { Markdown } from "./markdown";

export interface InfoItemProps {
   icon: ReactNode;
   label: string;
   value: string;
   className?: string;
}

export function InfoItem({ icon, label, value, className }: InfoItemProps) {
   return (
      <Credenza>
         <CredenzaTrigger className="flex flex-col items-start gap-1 p-2 bg-muted rounded-md w-full cursor-pointer">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
               {icon}
               <span>{label}</span>
            </div>
            <span
               className={cn(
                  "text-sm text-start font-semibold text-foreground normal-case truncate w-full",
                  className,
               )}
               title={value}
            >
               {value}
            </span>
         </CredenzaTrigger>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Details</CredenzaTitle>
               <CredenzaDescription>
                  More details about <strong>{label}</strong>
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 ">
               <Markdown content={value} />
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
