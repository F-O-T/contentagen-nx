import { PlusCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";

export function CreateNewContentRequestButton() {
   return (
      <Link to="/agents" className="inline-flex">
         <SquaredIconButton>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Content Request
         </SquaredIconButton>
      </Link>
   );
}
