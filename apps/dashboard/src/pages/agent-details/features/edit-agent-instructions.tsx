import { useMemo } from "react";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";
import type { AgentSelect } from "@packages/database/schema";
import { Button } from "@packages/ui/components/button";
import { useAppForm } from "@packages/ui/components/form";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { translate, type TranslationKey } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
} from "@packages/ui/components/card";
import {
   Tabs,
   TabsList,
   TabsTrigger,
   TabsContent,
} from "@packages/ui/components/tabs";
import type {
   InstructionsConfig,
   PersonaConfig,
} from "@packages/database/schemas/agent";

interface EditInstructionCard {
   titleKey: TranslationKey;
   descriptionKey: TranslationKey;
   placeholderKey: TranslationKey;
   fieldName: keyof InstructionsConfig;
}

export function EditAgentInstructions({
   agent,
   setEditing,
}: {
   agent: AgentSelect;
   setEditing: (editing: boolean) => void;
}) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const personaConfig = agent.personaConfig as PersonaConfig;

   const instructionCards = useMemo(() => {
      return [
         {
            titleKey: "pages.agent-details.instructions.tabs.audience.title",
            descriptionKey:
               "pages.agent-details.instructions.tabs.audience.description",
            placeholderKey:
               "pages.agent-details.instructions.tabs.audience.placeholder",
            fieldName: "audienceProfile" as const,
         },
         {
            titleKey: "pages.agent-details.instructions.tabs.writing.title",
            descriptionKey:
               "pages.agent-details.instructions.tabs.writing.description",
            placeholderKey:
               "pages.agent-details.instructions.tabs.writing.placeholder",
            fieldName: "writingGuidelines" as const,
         },
         {
            titleKey: "pages.agent-details.instructions.tabs.rag.title",
            descriptionKey:
               "pages.agent-details.instructions.tabs.rag.description",
            placeholderKey:
               "pages.agent-details.instructions.tabs.rag.placeholder",
            fieldName: "ragIntegration" as const,
         },
      ] as EditInstructionCard[];
   }, []);

   const editInstructionsMutation = useMutation(
      trpc.agent.update.mutationOptions({
         onError: (error) => {
            console.error("Error editing agent instructions:", error);
            toast.error(
               translate("pages.agent-details.instructions.edit.error"),
            );
         },
         onSuccess: async () => {
            toast.success(
               translate("pages.agent-details.instructions.edit.success"),
            );
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agent.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
         },
      }),
   );

   const editForm = useAppForm({
      defaultValues: {
         audienceProfile: "",
         writingGuidelines: "",
         ragIntegration: "",
      },
      validators: {
         //TODO: Onblur is not working when using the schema from the database
         onBlur: z.object({
            audienceProfile: z.string().min(1, "This field is required"),
            writingGuidelines: z.string().min(1, "This field is required"),
            ragIntegration: z.string().min(1, "This field is required"),
         }),
      },
      onSubmit: async ({ value }) => {
         const updatedPersonaConfig: PersonaConfig = {
            ...personaConfig,
            instructions: {
               audienceProfile: value.audienceProfile,
               writingGuidelines: value.writingGuidelines,
               ragIntegration: value.ragIntegration,
            },
         };

         await editInstructionsMutation.mutateAsync({
            id: agent.id,
            personaConfig: updatedPersonaConfig,
         });
         setEditing(false);
      },
   });

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <div>
               <h3 className="text-lg font-semibold">
                  {translate("pages.agent-details.instructions.title")}
               </h3>
               <p className="text-sm text-muted-foreground">
                  {translate("pages.agent-details.instructions.description")}
               </p>
            </div>
            <div className="flex items-center gap-2">
               <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(false)}
                  disabled={editInstructionsMutation.isPending}
               >
                  <X size={20} />
               </Button>
               <Button
                  type="button"
                  onClick={() => editForm.handleSubmit()}
                  disabled={
                     !editForm.state.canSubmit ||
                     editInstructionsMutation.isPending
                  }
               >
                  <Check size={20} />
               </Button>
            </div>
         </div>

         <Tabs defaultValue={instructionCards[0]?.titleKey}>
            <Card>
               <CardHeader className="">
                  <TabsList className="w-full">
                     {instructionCards.map((card) => (
                        <TabsTrigger key={card.titleKey} value={card.titleKey}>
                           {translate(card.titleKey)}
                        </TabsTrigger>
                     ))}
                  </TabsList>
               </CardHeader>
               <CardContent>
                  {instructionCards.map((card) => (
                     <TabsContent key={card.titleKey} value={card.titleKey}>
                        <div className="space-y-4">
                           <CardDescription>
                              {translate(card.descriptionKey)}
                           </CardDescription>
                           <editForm.AppField name={card.fieldName}>
                              {(field) => (
                                 <field.FieldContainer>
                                    <TiptapEditor
                                       value={field.state.value}
                                       onChange={field.handleChange}
                                       onBlur={field.handleBlur}
                                       placeholder={translate(
                                          card.placeholderKey,
                                       )}
                                    />
                                    <field.FieldMessage />
                                 </field.FieldContainer>
                              )}
                           </editForm.AppField>
                        </div>
                     </TabsContent>
                  ))}
               </CardContent>
            </Card>
         </Tabs>
      </div>
   );
}
