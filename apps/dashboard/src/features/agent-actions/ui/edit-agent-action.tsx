import { useRouter } from "@tanstack/react-router";

type EditAgentActionProps = {
   agentId: string;
};

export function EditAgentAction({ agentId }: EditAgentActionProps) {
   const router = useRouter();

   const handleEdit = () => {
      router.navigate({
         to: "/agents/$agentId/edit",
         params: { agentId },
      });
   };

   return { handleEdit };
}
