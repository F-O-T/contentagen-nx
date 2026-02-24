import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
   createFileRoute,
   useNavigate,
   useParams,
} from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { WriterBuilder } from "@/features/writers/ui/writer-builder";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/writers/new",
)({
   component: NewWriterPage,
});

function NewWriterPage() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const queryClient = useQueryClient();

   const [name, setName] = useState("");
   const [description, setDescription] = useState("");

   const createMutation = useMutation(
      orpc.writer.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Escritor criado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
            navigate({
               to: "/$slug/$teamSlug/writers/$writerId",
               params: { slug, teamSlug, writerId: data.id },
            });
         },
         onError: () => {
            toast.error("Erro ao criar escritor");
         },
      }),
   );

   const handleSave = useCallback(() => {
      if (!name.trim()) {
         toast.error("O nome do escritor é obrigatório");
         return;
      }

      createMutation.mutate({
         personaConfig: {
            metadata: {
               name: name.trim(),
               ...(description.trim()
                  ? { description: description.trim() }
                  : {}),
            },
         },
      });
   }, [name, description, createMutation]);

   return (
      <WriterBuilder
         description={description}
         isSaving={createMutation.isPending}
         name={name}
         onDescriptionChange={setDescription}
         onNameChange={setName}
         onSave={handleSave}
         profilePhotoUrl={null}
      />
   );
}
