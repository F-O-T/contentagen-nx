import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { FileText, Lightbulb } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface AgentNavigationButtonsProps {
   agentId: string;
}

export function AgentNavigationButtons({
   agentId,
}: AgentNavigationButtonsProps) {
   return (
      <div className="grid grid-cols-2 gap-4">
         <Link to="/content" search={{ agentId }}>
            <SquaredIconButton>
               <FileText className="w-6 h-6" />
               <span>Your agent content</span>
            </SquaredIconButton>
         </Link>
         <Link to="/ideas" search={{ agentId }}>
            <SquaredIconButton>
               <Lightbulb className="w-6 h-6" />
               <span>Your agent ideas</span>
            </SquaredIconButton>
         </Link>
      </div>
   );
}
