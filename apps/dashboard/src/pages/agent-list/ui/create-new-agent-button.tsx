import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";

export const CreateNewAgentButton = () => (
   <Link to="/agents/manual">
      <SquaredIconButton aria-label="Create new agent">
         <Plus size={24} />
         <div className="flex gap-2 items-center justify-center">
            Create a new agent
            <ArrowRight />
         </div>
      </SquaredIconButton>
   </Link>
);

