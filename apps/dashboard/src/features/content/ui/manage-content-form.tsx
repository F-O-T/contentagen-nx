import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Field, FieldLabel } from "@packages/ui/components/field";
import { Label } from "@packages/ui/components/label";
import {
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useForm } from "@tanstack/react-form";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, FileText, Sparkles } from "lucide-react";
import type { FC, FormEvent } from "react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type ManageContentFormProps = {
   writerId?: string;
   forceManual?: boolean;
};

function ManageContentErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertTriangle className="h-4 w-4" />
         <AlertDescription>
            {"Ocorreu um erro. Por favor, tente novamente."}
         </AlertDescription>
      </Alert>
   );
}

function ManageContentSkeleton() {
   return (
      <div className="grid gap-4 px-4">
         <Skeleton className="h-4 w-20" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-4 w-32" />
         <Skeleton className="h-20 w-full" />
         <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
         </div>
      </div>
   );
}

function ManageContentFormContent({
   writerId,
   forceManual,
}: ManageContentFormProps) {
   const { closeSheet } = useSheet();
   const navigate = useNavigate();
   const { activeOrganization } = useActiveOrganization();
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const [creationType, setCreationType] = useState<"manual" | "with-writer">(
      forceManual ? "manual" : writerId ? "with-writer" : "manual",
   );

   const { data: writersData } = useSuspenseQuery(
      trpc.writer.list.queryOptions({ limit: 100, page: 1 }),
   );

   const writers = writersData.items;

   const createMutation = useMutation(
      trpc.content.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Conteúdo criado com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            closeSheet();
            // Redirect to the content detail page
            if (data?.id) {
               navigate({
                  to: "/$slug/content/$contentId",
                  params: {
                     slug: activeOrganization.slug,
                     contentId: data.id,
                  },
               });
            }
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const isPending = createMutation.isPending;

   const form = useForm({
      defaultValues: {
         writerId: writerId ?? "",
      },
      onSubmit: async ({ value }) => {
         if (creationType === "manual") {
            createMutation.mutate({});
         } else {
            createMutation.mutate({
               writerId: value.writerId,
            });
         }
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   const canSubmit =
      creationType === "manual" ||
      (creationType === "with-writer" && form.state.values.writerId);

   return (
      <>
         <form
            className="grid gap-6 px-4 overflow-y-auto"
            onSubmit={handleSubmit}
         >
            {!forceManual && writers.length > 0 && (
               <RadioGroup
                  className="grid gap-3"
                  onValueChange={(value) =>
                     setCreationType(value as "manual" | "with-writer")
                  }
                  value={creationType}
               >
                  <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                     <RadioGroupItem
                        className="mt-1"
                        id="manual"
                        value="manual"
                     />
                     <Label
                        className="flex-1 cursor-pointer space-y-1"
                        htmlFor="manual"
                     >
                        <div className="flex items-center gap-2">
                           <FileText className="h-4 w-4" />
                           <span className="font-medium">
                              Escrever manualmente
                           </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                           Comece com um documento em branco e escreva você
                           mesmo.
                        </p>
                     </Label>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                     <RadioGroupItem
                        className="mt-1"
                        id="with-writer"
                        value="with-writer"
                     />
                     <Label
                        className="flex-1 cursor-pointer space-y-1"
                        htmlFor="with-writer"
                     >
                        <div className="flex items-center gap-2">
                           <Sparkles className="h-4 w-4" />
                           <span className="font-medium">Usar escritor IA</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                           A IA vai te ajudar a planejar e escrever seu
                           conteúdo.
                        </p>
                     </Label>
                  </div>
               </RadioGroup>
            )}

            {creationType === "with-writer" && writers.length > 0 && (
               <form.Field name="writerId">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>
                           {"Selecione um escritor"}
                        </FieldLabel>
                        <Select
                           onValueChange={field.handleChange}
                           value={field.state.value}
                        >
                           <SelectTrigger>
                              <SelectValue
                                 placeholder={"Selecione um escritor"}
                              />
                           </SelectTrigger>
                           <SelectContent>
                              {writers.map((writer) => (
                                 <SelectItem key={writer.id} value={writer.id}>
                                    {writer.personaConfig.metadata.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </Field>
                  )}
               </form.Field>
            )}

            {creationType === "manual" && (
               <p className="text-sm text-muted-foreground">
                  Você terá um editor completo para escrever seu conteúdo.
                  Poderá adicionar títulos, imagens, links e muito mais.
               </p>
            )}

            {writers.length === 0 && !forceManual && (
               <p className="text-sm text-muted-foreground">
                  Você ainda não tem nenhum escritor IA. O conteúdo será criado
                  em modo manual.
               </p>
            )}
         </form>

         <SheetFooter>
            <Button onClick={closeSheet} type="button" variant="outline">
               {"Cancelar"}
            </Button>
            <Button
               disabled={!canSubmit || isPending}
               onClick={() => form.handleSubmit()}
               type="submit"
            >
               {isPending ? "Criando..." : "Criar conteúdo"}
            </Button>
         </SheetFooter>
      </>
   );
}

export const ManageContentForm: FC<ManageContentFormProps> = ({
   writerId,
   forceManual,
}) => {
   return (
      <>
         <SheetHeader>
            <SheetTitle>{"Novo Conteúdo"}</SheetTitle>
            <SheetDescription>
               {"Escolha como você quer criar seu novo conteúdo."}
            </SheetDescription>
         </SheetHeader>
         <ErrorBoundary FallbackComponent={ManageContentErrorFallback}>
            <Suspense fallback={<ManageContentSkeleton />}>
               <ManageContentFormContent
                  writerId={writerId}
                  forceManual={forceManual}
               />
            </Suspense>
         </ErrorBoundary>
      </>
   );
};
