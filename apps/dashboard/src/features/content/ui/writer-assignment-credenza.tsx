"use client";

import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Input } from "@packages/ui/components/input";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useTRPC } from "@/integrations/clients";

type WriterAssignmentCredenzaProps = {
   contentId: string;
   currentWriterId: string | null;
   onSelect: (writerId: string | null) => void;
   isPending?: boolean;
};

export function WriterAssignmentCredenza({
   currentWriterId,
   onSelect,
   isPending = false,
}: WriterAssignmentCredenzaProps) {
   const [searchTerm, setSearchTerm] = useState("");
   const trpc = useTRPC();

   // Fetch all writers
   const { data: writersData, isLoading } = useQuery(
      trpc.agent.list.queryOptions({ limit: 100, page: 1 }),
   );

   const writers = writersData?.items ?? [];

   // Filter writers based on search
   const filteredWriters = useMemo(() => {
      if (!searchTerm) return writers;
      const lowerSearch = searchTerm.toLowerCase();
      return writers.filter(
         (writer) =>
            writer.personaConfig.metadata.name
               .toLowerCase()
               .includes(lowerSearch) ||
            writer.personaConfig.metadata.description
               ?.toLowerCase()
               .includes(lowerSearch),
      );
   }, [writers, searchTerm]);

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Atribuir Escritor</CredenzaTitle>
            <CredenzaDescription>
               Selecione um escritor IA para ajudar com este conteúdo
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {/* Search input */}
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
               <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar escritores..."
                  value={searchTerm}
               />
            </div>

            {/* Option to remove writer (manual mode) */}
            <button
               className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-md text-left hover:bg-muted/50 border border-dashed transition-colors",
                  currentWriterId === null && "border-primary bg-primary/5",
                  isPending && "opacity-50 pointer-events-none",
               )}
               disabled={isPending}
               onClick={() => onSelect(null)}
               type="button"
            >
               <div className="flex items-center justify-center size-8 rounded-full bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Sem escritor (manual)</p>
                  <p className="text-xs text-muted-foreground">
                     Escreva o conteúdo você mesmo
                  </p>
               </div>
               {currentWriterId === null && (
                  <Check className="size-4 text-primary shrink-0" />
               )}
               {isPending && currentWriterId !== null && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
               )}
            </button>

            {/* Writers list */}
            <ScrollArea className="h-[250px] rounded-md border">
               {isLoading ? (
                  <div className="p-4 space-y-3">
                     <Skeleton className="h-14 w-full" />
                     <Skeleton className="h-14 w-full" />
                     <Skeleton className="h-14 w-full" />
                  </div>
               ) : filteredWriters.length > 0 ? (
                  <div className="p-2 space-y-1">
                     {filteredWriters.map((writer) => {
                        const isSelected = currentWriterId === writer.id;
                        const isSelecting = isPending && !isSelected;

                        return (
                           <button
                              className={cn(
                                 "w-full flex items-center gap-3 p-3 rounded-md text-left hover:bg-muted/50 transition-colors",
                                 isSelected &&
                                    "bg-primary/5 ring-1 ring-primary",
                                 isSelecting && "opacity-50",
                              )}
                              disabled={isPending}
                              key={writer.id}
                              onClick={() => onSelect(writer.id)}
                              type="button"
                           >
                              <Avatar className="size-8">
                                 {writer.profilePhotoUrl && (
                                    <AvatarImage src={writer.profilePhotoUrl} />
                                 )}
                                 <AvatarFallback className="text-xs">
                                    {writer.personaConfig.metadata.name.charAt(
                                       0,
                                    )}
                                 </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium truncate">
                                    {writer.personaConfig.metadata.name}
                                 </p>
                                 {writer.personaConfig.metadata.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                       {
                                          writer.personaConfig.metadata
                                             .description
                                       }
                                    </p>
                                 )}
                              </div>
                              {isSelected && (
                                 <Check className="size-4 text-primary shrink-0" />
                              )}
                              {isPending && isSelected && (
                                 <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                              )}
                           </button>
                        );
                     })}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                     <Sparkles className="size-10 text-muted-foreground mb-2" />
                     <p className="text-sm text-muted-foreground">
                        {searchTerm
                           ? "Nenhum escritor encontrado"
                           : "Nenhum escritor criado"}
                     </p>
                     {!searchTerm && (
                        <p className="text-xs text-muted-foreground mt-1">
                           Crie um escritor IA para começar
                        </p>
                     )}
                  </div>
               )}
            </ScrollArea>
         </CredenzaBody>
      </>
   );
}
