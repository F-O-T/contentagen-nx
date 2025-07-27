import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";

export const CreateNewAgentButton = () => (
   <Link to="/agents/manual">
      <SquaredIconButton aria-label="Create new agent">
         <Plus />
         Create a new agent
      </SquaredIconButton>
   </Link>
);
