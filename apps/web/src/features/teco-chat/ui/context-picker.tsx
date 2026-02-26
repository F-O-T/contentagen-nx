import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AtSign, FileText, Search } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/integrations/orpc/client";

export interface ContextItem {
   type: "content" | "current-document";
   id: string;
   label: string;
}

interface ContextPickerProps {
   onSelect: (item: ContextItem) => void;
   currentDocumentId?: string;
   currentDocumentLabel?: string;
}

function ContextPickerInner({
   onSelect,
   currentDocumentId,
   currentDocumentLabel,
}: ContextPickerProps) {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState("");

   const { data } = useSuspenseQuery(
      orpc.content.listAllContent.queryOptions({ input: { limit: 50 } }),
   );

   const items = data?.items ?? [];
   const filtered = items.filter((c) =>
      (c.meta.title ?? "").toLowerCase().includes(search.toLowerCase()),
   );

   const handleSelect = (item: ContextItem) => {
      onSelect(item);
      setOpen(false);
      setSearch("");
   };

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <PopoverTrigger asChild>
            <Button
               className="h-7 gap-1 px-2 text-xs text-muted-foreground"
               size="sm"
               type="button"
               variant="ghost"
            >
               <AtSign className="size-3" />
               Contexto
            </Button>
         </PopoverTrigger>
         <PopoverContent align="start" className="w-80 p-0" side="top">
            <div className="border-b p-2">
               <div className="relative">
                  <Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" />
                  <Input
                     autoFocus
                     className="h-8 pl-7 text-xs"
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Pesquisar conteúdos..."
                     value={search}
                  />
               </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
               {currentDocumentId && (
                  <div className="border-b">
                     <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Documento atual
                     </p>
                     <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() =>
                           handleSelect({
                              type: "current-document",
                              id: currentDocumentId,
                              label: currentDocumentLabel ?? "Documento atual",
                           })
                        }
                        type="button"
                     >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                        <span>Usar documento aberto</span>
                     </button>
                  </div>
               )}

               <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Conteúdos
               </p>
               {filtered.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                     Nenhum conteúdo encontrado.
                  </p>
               )}
               {filtered.map((content) => (
                  <button
                     className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
                     key={content.id}
                     onClick={() =>
                        handleSelect({
                           type: "content",
                           id: content.id,
                           label: content.meta.title ?? "Sem título",
                        })
                     }
                     type="button"
                  >
                     <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                     <span className="truncate">
                        {content.meta.title ?? "Sem título"}
                     </span>
                  </button>
               ))}
            </div>
         </PopoverContent>
      </Popover>
   );
}

export { ContextPickerInner as ContextPicker };
