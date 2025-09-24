import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { FileText, Lightbulb } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { translate } from "@packages/localization";

interface AgentNavigationButtonsProps {
   agentId: string;
}

export function AgentNavigationButtons({
   agentId,
}: AgentNavigationButtonsProps) {
   return (
      <div className="grid grid-cols-2 gap-4">
         <Link to="/content" search={{ agentId, page: 1 }}>
            <SquaredIconButton>
               <FileText className="w-6 h-6" />
               <span>
                  {translate("pages.agent-details.navigation.agent-content")}
               </span>
            </SquaredIconButton>
         </Link>
         <Link to="/ideas" search={{ agentId }}>
            <SquaredIconButton>
               <Lightbulb className="w-6 h-6" />
               <span>
                  {translate("pages.agent-details.navigation.agent-ideas")}
               </span>
            </SquaredIconButton>
         </Link>
      </div>
   );
}
