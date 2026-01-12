import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Plus } from "lucide-react";
import { Fragment } from "react";
import { UpgradePrompt } from "@/features/upgrade/ui/upgrade-prompt";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { ManageMemoryForm } from "./manage-memory-form";
import { MemoryItem } from "./memory-item";

type AgentMemoriesCardProps = {
   agentId: string;
};

function AgentMemoriesCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-1" />
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               {Array.from({ length: 2 }).map((_, i) => (
                  <div
                     className="flex items-start gap-4"
                     key={`memory-skeleton-${i + 1}`}
                  >
                     <Skeleton className="h-5 w-9" />
                     <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                     </div>
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>
   );
}

export function AgentMemoriesCard({ agentId }: AgentMemoriesCardProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { openSheet } = useSheet();
   const { hasFeature } = useFeatureAccess();
   const hasAgentMemoriesFeature = hasFeature(Feature.AGENT_MEMORIES);

   const {
      data: memories,
      isLoading,
      isError,
   } = useQuery({
      ...trpc.agent.listInstructions.queryOptions({ agentId }),
      enabled: hasAgentMemoriesFeature,
   });

   const toggleMutation = useMutation({
      ...trpc.agent.toggleInstructionEnabled.mutationOptions(),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: trpc.agent.listInstructions.queryKey({ agentId }),
         });
      },
   });

   const deleteMutation = useMutation({
      ...trpc.agent.deleteInstruction.mutationOptions(),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: trpc.agent.listInstructions.queryKey({ agentId }),
         });
      },
   });

   const handleAddMemory = () => {
      openSheet({
         children: <ManageMemoryForm agentId={agentId} />,
      });
   };

   const handleEditMemory = (memoryId: string) => {
      const memory = memories?.find((m) => m.id === memoryId);
      if (memory) {
         openSheet({
            children: <ManageMemoryForm agentId={agentId} memory={memory} />,
         });
      }
   };

   const handleToggleMemory = (memoryId: string) => {
      toggleMutation.mutate({
         agentId,
         instructionId: memoryId,
      });
   };

   const handleDeleteMemory = (memoryId: string) => {
      deleteMutation.mutate({
         agentId,
         instructionId: memoryId,
      });
   };

   // Show upgrade prompt if user doesn't have agent memories feature
   if (!hasAgentMemoriesFeature) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>{"Memórias do Escritor"}</CardTitle>
               <CardDescription>
                  {
                     "Instruções persistentes que guiam o comportamento do agente"
                  }
               </CardDescription>
            </CardHeader>
            <CardContent>
               <UpgradePrompt
                  description="Configure memórias persistentes para personalizar o comportamento do seu escritor IA."
                  feature={Feature.AGENT_MEMORIES}
                  title="Memórias do Agente"
               />
            </CardContent>
         </Card>
      );
   }

   if (isLoading) {
      return <AgentMemoriesCardSkeleton />;
   }

   if (isError) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>{"Memórias do Escritor"}</CardTitle>
               <CardDescription>
                  {"Erro ao carregar memórias. Tente novamente."}
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   const sortedMemories = [...(memories ?? [])].sort(
      (a, b) => a.order - b.order,
   );
   const hasMemories = sortedMemories.length > 0;

   return (
      <Card>
         <CardHeader>
            <CardTitle>{"Memórias do Escritor"}</CardTitle>
            <CardDescription>
               {"Instruções persistentes que guiam o comportamento do agente"}
            </CardDescription>
            <CardAction>
               <Button onClick={handleAddMemory} size="sm" variant="outline">
                  <Plus className="size-4" />
                  {"Adicionar"}
               </Button>
            </CardAction>
         </CardHeader>
         <CardContent>
            {hasMemories ? (
               <ItemGroup>
                  {sortedMemories.map((memory, index) => (
                     <Fragment key={memory.id}>
                        <MemoryItem
                           isDeleting={
                              deleteMutation.isPending &&
                              deleteMutation.variables?.instructionId ===
                                 memory.id
                           }
                           isToggling={
                              toggleMutation.isPending &&
                              toggleMutation.variables?.instructionId ===
                                 memory.id
                           }
                           memory={memory}
                           onDelete={() => handleDeleteMemory(memory.id)}
                           onEdit={() => handleEditMemory(memory.id)}
                           onToggle={() => handleToggleMemory(memory.id)}
                        />
                        {index !== sortedMemories.length - 1 && (
                           <ItemSeparator />
                        )}
                     </Fragment>
                  ))}
               </ItemGroup>
            ) : (
               <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                     <Brain className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                     {"Nenhuma memória configurada"}
                  </p>
                  <Button onClick={handleAddMemory} size="sm" variant="outline">
                     <Plus className="size-4" />
                     {"Adicionar memória"}
                  </Button>
               </div>
            )}
         </CardContent>
      </Card>
   );
}
