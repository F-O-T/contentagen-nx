import type { Asset } from "@packages/database/schemas/assets";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaBody,
   CredenzaClose,
   CredenzaContent,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaTrigger,
} from "@packages/ui/components/credenza";
import { Input } from "@packages/ui/components/input";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { FileIcon, ImageIcon, Search, X } from "lucide-react";
import { Suspense, useState } from "react";
import { orpc } from "@/integrations/orpc/client";

// ============================================================
// Props
// ============================================================

interface AssetBankModalProps {
   onSelect: (asset: Asset) => void;
   teamId?: string;
   trigger?: React.ReactNode;
}

// ============================================================
// Asset grid item
// ============================================================

interface AssetGridItemProps {
   asset: Asset;
   isSelected: boolean;
   onSelect: (asset: Asset) => void;
}

function AssetGridItem({ asset, isSelected, onSelect }: AssetGridItemProps) {
   const isImage = asset.mimeType.startsWith("image/");

   return (
      <button
         className={`
            relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer
            ${
               isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-transparent hover:border-muted-foreground/50"
            }
            bg-muted
         `}
         onClick={() => onSelect(asset)}
         title={asset.filename}
         type="button"
      >
         {isImage ? (
            <img
               alt={asset.alt ?? asset.filename}
               className="w-full h-full object-cover"
               src={asset.publicUrl}
            />
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
               <FileIcon className="size-6 text-muted-foreground" />
               <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {asset.filename}
               </span>
            </div>
         )}
      </button>
   );
}

// ============================================================
// Inner grid with suspense
// ============================================================

interface AssetGridProps {
   teamId?: string;
   search: string;
   selectedId: string | null;
   onSelect: (asset: Asset) => void;
}

function AssetGrid({ teamId, search, selectedId, onSelect }: AssetGridProps) {
   const { data } = useSuspenseQuery(
      orpc.assets.list.queryOptions({
         input: {
            teamId: teamId ?? null,
            search: search || undefined,
            limit: 48,
            offset: 0,
         },
      }),
   );

   const assets: Asset[] = data?.assets ?? (Array.isArray(data) ? data : []);

   if (assets.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <ImageIcon className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
               {search
                  ? "Nenhum arquivo encontrado para sua busca."
                  : "Nenhum arquivo no banco de imagens ainda."}
            </p>
         </div>
      );
   }

   return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
         {assets.map((asset) => (
            <AssetGridItem
               asset={asset}
               isSelected={selectedId === asset.id}
               key={asset.id}
               onSelect={onSelect}
            />
         ))}
      </div>
   );
}

// ============================================================
// Grid skeleton
// ============================================================

function AssetGridSkeleton() {
   return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
         {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton
               className="aspect-square rounded-lg"
               key={`modal-skeleton-${i + 1}`}
            />
         ))}
      </div>
   );
}

// ============================================================
// Modal component
// ============================================================

export function AssetBankModal({
   onSelect,
   teamId,
   trigger,
}: AssetBankModalProps) {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
   const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

   const handleSearchChange = (value: string) => {
      setSearch(value);
   };

   const handleClearSearch = () => {
      setSearch("");
   };

   const handleSelect = (asset: Asset) => {
      setSelectedAsset(asset);
   };

   const handleInsert = () => {
      if (!selectedAsset) return;
      onSelect(selectedAsset);
      setOpen(false);
      setSelectedAsset(null);
      setSearch("");
   };

   const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (!next) {
         setSelectedAsset(null);
         setSearch("");
      }
   };

   return (
      <Credenza onOpenChange={handleOpenChange} open={open}>
         {trigger ? (
            <CredenzaTrigger asChild>{trigger}</CredenzaTrigger>
         ) : (
            <CredenzaTrigger asChild>
               <Button size="sm" variant="outline">
                  <ImageIcon className="size-4 mr-2" />
                  Banco de Imagens
               </Button>
            </CredenzaTrigger>
         )}

         <CredenzaContent className="sm:max-w-3xl">
            <CredenzaHeader>
               <CredenzaTitle>Banco de Imagens</CredenzaTitle>
            </CredenzaHeader>

            <CredenzaBody className="flex flex-col gap-4">
               {/* Search */}
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                     className="pl-9 pr-8"
                     onChange={(e) => handleSearchChange(e.target.value)}
                     placeholder="Buscar arquivos..."
                     value={search}
                  />
                  {search && (
                     <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={handleClearSearch}
                        type="button"
                     >
                        <X className="size-4" />
                     </button>
                  )}
               </div>

               {/* Asset grid */}
               <div className="max-h-[400px] overflow-y-auto">
                  <Suspense fallback={<AssetGridSkeleton />}>
                     <AssetGrid
                        onSelect={handleSelect}
                        search={debouncedSearch}
                        selectedId={selectedAsset?.id ?? null}
                        teamId={teamId}
                     />
                  </Suspense>
               </div>

               {/* Selected asset info */}
               {selectedAsset && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                     <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                     <span className="truncate text-muted-foreground">
                        Selecionado:{" "}
                     </span>
                     <span className="truncate font-medium">
                        {selectedAsset.filename}
                     </span>
                  </div>
               )}
            </CredenzaBody>

            <CredenzaFooter>
               <CredenzaClose asChild>
                  <Button variant="outline">Cancelar</Button>
               </CredenzaClose>
               <Button disabled={!selectedAsset} onClick={handleInsert}>
                  Inserir imagem
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}
