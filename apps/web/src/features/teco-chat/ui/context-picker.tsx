import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { cn } from "@packages/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, AtSign, FileText } from "lucide-react";
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

type Category = "content" | "current-document";

function ContextPickerInner({
   onSelect,
   currentDocumentId,
   currentDocumentLabel,
}: ContextPickerProps) {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState("");
   const [selectedCategory, setSelectedCategory] =
      useState<Category>("content");
   const [sortAsc, setSortAsc] = useState(false);

   const { data, isLoading } = useQuery({
      ...orpc.content.listAllContent.queryOptions({ input: { limit: 50 } }),
      enabled: open,
   });

   const contentItems = data?.items ?? [];

   const filteredContent = contentItems
      .filter((c) =>
         (c.meta.title ?? "").toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
         const titleA = a.meta.title ?? "";
         const titleB = b.meta.title ?? "";
         return sortAsc
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
      });

   const handleSelect = (item: ContextItem) => {
      onSelect(item);
      setOpen(false);
      setSearch("");
   };

   const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (!next) setSearch("");
   };

   const categories = [
      ...(currentDocumentId
         ? [
              {
                 id: "current-document" as Category,
                 label: "Documento atual",
                 count: 1,
              },
           ]
         : []),
      {
         id: "content" as Category,
         label: "Conteúdo",
         count: contentItems.length,
      },
   ];

   const categoryLabel =
      selectedCategory === "current-document" ? "Documento atual" : "Conteúdos";

   return (
      <Popover onOpenChange={handleOpenChange} open={open}>
         <PopoverTrigger asChild>
            <button
               className="flex h-7 items-center gap-1 rounded px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
               type="button"
            >
               <AtSign className="size-3" />
               Contexto
            </button>
         </PopoverTrigger>
         <PopoverContent align="start" className="w-[480px] p-0" side="top">
            {/* Search bar */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
               <span className="text-muted-foreground">
                  <svg
                     aria-hidden="true"
                     className="size-4"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth={2}
                     viewBox="0 0 24 24"
                  >
                     <circle cx="11" cy="11" r="8" />
                     <path d="m21 21-4.35-4.35" />
                  </svg>
               </span>
               <input
                  // biome-ignore lint/a11y/noAutofocus: search input in popover should autofocus for UX
                  autoFocus
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar conteúdos..."
                  value={search}
               />
            </div>

            {/* Two-panel body */}
            <div className="flex">
               {/* Left: Categories */}
               <div className="w-40 shrink-0 border-r p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                     Categorias
                  </p>
                  <div className="flex flex-col gap-1">
                     {categories.map((cat) => (
                        <button
                           className={cn(
                              "w-full rounded px-2 py-1 text-left text-xs font-medium transition-colors",
                              selectedCategory === cat.id
                                 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                 : "text-muted-foreground hover:bg-accent hover:text-foreground",
                           )}
                           key={cat.id}
                           onClick={() => setSelectedCategory(cat.id)}
                           type="button"
                        >
                           {cat.label}
                           {!isLoading && open && (
                              <span className="ml-1 opacity-70">
                                 : {cat.count}
                              </span>
                           )}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Right: Items */}
               <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between border-b px-3 py-1.5">
                     <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {categoryLabel}
                     </p>
                     <button
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setSortAsc((prev) => !prev)}
                        title={sortAsc ? "Ordenar Z→A" : "Ordenar A→Z"}
                        type="button"
                     >
                        <ArrowUpDown className="size-3.5" />
                     </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                     {selectedCategory === "current-document" &&
                        currentDocumentId && (
                           <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
                              onClick={() =>
                                 handleSelect({
                                    type: "current-document",
                                    id: currentDocumentId,
                                    label:
                                       currentDocumentLabel ??
                                       "Documento atual",
                                 })
                              }
                              type="button"
                           >
                              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">
                                 {currentDocumentLabel ?? "Documento atual"}
                              </span>
                           </button>
                        )}

                     {selectedCategory === "content" && (
                        <>
                           {isLoading && (
                              <p className="px-3 py-2 text-xs text-muted-foreground">
                                 Carregando...
                              </p>
                           )}
                           {!isLoading && filteredContent.length === 0 && (
                              <p className="px-3 py-2 text-xs text-muted-foreground">
                                 Nenhum conteúdo encontrado.
                              </p>
                           )}
                           {filteredContent.map((content) => (
                              <button
                                 className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
                                 key={content.id}
                                 onClick={() =>
                                    handleSelect({
                                       type: "content",
                                       id: content.id,
                                       label:
                                          content.meta.title ?? "Sem título",
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
                        </>
                     )}
                  </div>
               </div>
            </div>
         </PopoverContent>
      </Popover>
   );
}

export { ContextPickerInner as ContextPicker };
