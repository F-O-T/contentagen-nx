import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useRef, useTransition } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { flattenFolders } from "@/features/analytics/hooks/use-folders";

interface NewFolderSheetContentProps {
   teamId: string;
   onSuccess: () => void;
}

export function NewFolderSheetContent({
   teamId,
   onSuccess,
}: NewFolderSheetContentProps) {
   const parentIdRef = useRef<HTMLInputElement>(null);
   const { data: folders } = useSuspenseQuery(orpc.folders.list.queryOptions({ input: { teamId } }));
   const [isPending, startTransition] = useTransition();

   const createMutation = useMutation(orpc.folders.create.mutationOptions());

   const parentOptions = [
      { id: null as string | null, name: "Nenhuma (raiz)" },
      ...flattenFolders(folders).map((f) => ({ id: f.id, name: f.name })),
   ];

   const handleSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault();
         const form = e.currentTarget;
         const name = (form.elements.namedItem("name") as HTMLInputElement)
            ?.value?.trim();
         const parentIdRaw = (
            form.elements.namedItem("parentId") as HTMLInputElement | null
         )?.value;
         if (!name) {
            toast.error("Informe o nome da pasta");
            return;
         }
         const parentId =
            !parentIdRaw || parentIdRaw === "root" ? null : parentIdRaw;
         startTransition(async () => {
            try {
               await createMutation.mutateAsync({
                  name,
                  parentId,
               });
               toast.success("Pasta criada");
               onSuccess();
            } catch {
               toast.error("Erro ao criar pasta");
            }
         });
      },
      [createMutation, onSuccess],
   );

   return (
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
         <h2 className="text-lg font-semibold">Nova pasta</h2>
         <div className="grid gap-2">
            <Label htmlFor="folder-name">Nome</Label>
            <Input
               id="folder-name"
               name="name"
               placeholder="Ex: Marketing"
               required
            />
         </div>
         {parentOptions.length > 1 && (
            <div className="grid gap-2">
               <Label htmlFor="folder-parent">Pasta pai</Label>
               <input
                  name="parentId"
                  ref={parentIdRef}
                  type="hidden"
               />
               <Select
                  onValueChange={(value) => {
                     if (parentIdRef.current) {
                        parentIdRef.current.value =
                           value === "root" ? "" : value;
                     }
                  }}
               >
                  <SelectTrigger id="folder-parent">
                     <SelectValue placeholder="Nenhuma (raiz)" />
                  </SelectTrigger>
                  <SelectContent>
                     {parentOptions.map((opt) => (
                        <SelectItem
                           key={opt.id ?? "root"}
                           value={opt.id ?? "root"}
                        >
                           {opt.name}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         )}
         <Button disabled={isPending} type="submit">
            Criar pasta
         </Button>
      </form>
   );
}
