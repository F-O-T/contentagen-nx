import type { ReactNode } from "react";
import { PageHeader } from "./page-header";

interface DefaultHeaderProps {
   title: string;
   description: ReactNode;
   actions?: ReactNode;
   /** Secondary actions shown below the title (e.g., filter chips) */
   secondaryActions?: ReactNode;
}

export function DefaultHeader({
   title,
   description,
   actions,
   secondaryActions,
}: DefaultHeaderProps) {
   return (
      <div className="flex flex-col gap-4">
         <PageHeader
            actions={actions}
            description={description}
            title={title}
         />
         {secondaryActions != null && (
            <div className="flex flex-wrap items-center gap-4">
               {secondaryActions}
            </div>
         )}
      </div>
   );
}
