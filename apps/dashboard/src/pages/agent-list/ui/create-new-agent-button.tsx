import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { translate } from "@packages/localization";

export const CreateNewAgentButton = () => (
   <Link to="/agents/manual">
      <SquaredIconButton
         aria-label={translate("pages.agent-list.create-button.aria-label")}
      >
         <Plus />
         {translate("pages.agent-list.create-button.text")}
      </SquaredIconButton>
   </Link>
);
