import type { ScopeAccess } from "@packages/database/schemas/personal-api-key";
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
import { Separator } from "@packages/ui/components/separator";
import {
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Spinner } from "@packages/ui/components/spinner";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { cn } from "@packages/ui/lib/utils";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/integrations/orpc/client";

interface CreateKeyFormProps {
   onSuccess: (result: {
      id: string;
      label: string;
      keyPrefix: string;
      plaintextKey: string;
      createdAt: Date;
   }) => void;
}

export function CreateKeyForm({ onSuccess }: CreateKeyFormProps) {
   const queryClient = useQueryClient();
   const { data: scopeData } = useSuspenseQuery(
      orpc.personalApiKey.getScopeDefinitions.queryOptions({}),
   );

   const [label, setLabel] = useState("");
   const [orgAccessMode, setOrgAccessMode] = useState<"all" | "specific">(
      "all",
   );
   const [selectedOrgIds] = useState<string[]>([]);
   const [scopes, setScopes] = useState<Record<string, ScopeAccess>>(() =>
      Object.fromEntries(
         scopeData.definitions.map((d) => [d.resource, "none" as ScopeAccess]),
      ),
   );
   const [scopeSearch, setScopeSearch] = useState("");
   const [selectedPreset, setSelectedPreset] = useState<string>("");

   const createMutation = useMutation(
      orpc.personalApiKey.create.mutationOptions({
         onSuccess: (data) => {
            queryClient.invalidateQueries({
               queryKey: orpc.personalApiKey.list.queryOptions({}).queryKey,
            });
            onSuccess(data);
         },
      }),
   );

   function handlePresetChange(presetId: string) {
      setSelectedPreset(presetId);
      if (presetId === "custom") return;

      const preset = scopeData.presets.find((p) => p.id === presetId);
      if (preset) {
         setScopes({ ...preset.scopes });
      }
   }

   function handleScopeChange(resource: string, value: ScopeAccess) {
      setScopes((prev) => ({ ...prev, [resource]: value }));
      setSelectedPreset("custom");
   }

   function handleCreate() {
      if (!label.trim()) return;

      createMutation.mutate({
         label: label.trim(),
         scopes,
         organizationAccess: orgAccessMode === "all" ? "all" : selectedOrgIds,
      });
   }

   const filteredDefinitions = scopeData.definitions.filter((d) => {
      if (!scopeSearch) return true;
      const q = scopeSearch.toLowerCase();
      return (
         d.label.toLowerCase().includes(q) ||
         d.resource.toLowerCase().includes(q) ||
         d.description.toLowerCase().includes(q)
      );
   });

   const activeScopeCount = Object.values(scopes).filter(
      (v) => v !== "none",
   ).length;

   const isValid = label.trim().length > 0;

   return (
      <div className="flex h-full flex-col">
         <SheetHeader>
            <SheetTitle>Criar chave de API</SheetTitle>
            <SheetDescription>
               Crie uma chave de API pessoal para acessar a API do Contentta.
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 overflow-y-auto space-y-6 py-6">
            {/* Label */}
            <div className="space-y-2 px-1">
               <Label htmlFor="key-label">Nome da chave</Label>
               <Input
                  id="key-label"
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Integração com site, CLI local"
                  value={label}
               />
            </div>

            {/* Organization Access */}
            <div className="space-y-2 px-1">
               <Label>Acesso a organizações</Label>
               <Tabs
                  onValueChange={(v) =>
                     setOrgAccessMode(v as "all" | "specific")
                  }
                  value={orgAccessMode}
               >
                  <TabsList className="w-full">
                     <TabsTrigger className="flex-1" value="all">
                        Todas as organizações
                     </TabsTrigger>
                     <TabsTrigger className="flex-1" value="specific">
                        Organizações específicas
                     </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                     <p className="text-xs text-muted-foreground mt-2">
                        A chave terá acesso a todas as organizações das quais
                        você é membro.
                     </p>
                  </TabsContent>
                  <TabsContent value="specific">
                     <p className="text-xs text-muted-foreground mt-2">
                        Selecione organizações específicas para limitar o acesso
                        desta chave. (Em breve)
                     </p>
                  </TabsContent>
               </Tabs>
            </div>

            <Separator />

            {/* Scopes */}
            <div className="space-y-3 px-1">
               <div className="flex items-center justify-between">
                  <Label>
                     Permissões{" "}
                     <span className="text-muted-foreground font-normal">
                        ({activeScopeCount} de {scopeData.definitions.length}{" "}
                        ativas)
                     </span>
                  </Label>
                  <Select
                     onValueChange={handlePresetChange}
                     value={selectedPreset}
                  >
                     <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Preset..." />
                     </SelectTrigger>
                     <SelectContent>
                        {scopeData.presets.map((preset) => (
                           <SelectItem key={preset.id} value={preset.id}>
                              {preset.label}
                           </SelectItem>
                        ))}
                        <SelectItem value="custom">Personalizado</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               {/* Scope search */}
               <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                     className="pl-8 h-9 text-sm"
                     onChange={(e) => setScopeSearch(e.target.value)}
                     placeholder="Pesquisar permissões..."
                     value={scopeSearch}
                  />
               </div>

               {/* Scope list */}
               <div className="space-y-1 max-h-[320px] overflow-y-auto">
                  {filteredDefinitions.map((def) => (
                     <div
                        className="flex items-center justify-between gap-4 rounded-lg border p-3"
                        key={def.resource}
                     >
                        <div className="min-w-0 flex-1">
                           <p className="text-sm font-medium leading-none">
                              {def.label}
                           </p>
                           <p className="text-xs text-muted-foreground mt-1">
                              {def.description}
                           </p>
                        </div>
                        <ToggleGroup
                           className="shrink-0"
                           onValueChange={(v) => {
                              if (v)
                                 handleScopeChange(
                                    def.resource,
                                    v as ScopeAccess,
                                 );
                           }}
                           size="sm"
                           type="single"
                           value={scopes[def.resource] ?? "none"}
                           variant="outline"
                        >
                           <ToggleGroupItem
                              className={cn(
                                 "text-xs px-2.5 h-7",
                                 scopes[def.resource] === "none" &&
                                    "bg-muted text-muted-foreground",
                              )}
                              value="none"
                           >
                              Nenhum
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className={cn(
                                 "text-xs px-2.5 h-7",
                                 scopes[def.resource] === "read" &&
                                    "bg-blue-500/10 text-blue-600 border-blue-500/30",
                              )}
                              value="read"
                           >
                              Leitura
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className={cn(
                                 "text-xs px-2.5 h-7",
                                 scopes[def.resource] === "write" &&
                                    "bg-orange-500/10 text-orange-600 border-orange-500/30",
                              )}
                              value="write"
                           >
                              Escrita
                           </ToggleGroupItem>
                        </ToggleGroup>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Footer */}
         <div className="border-t pt-4 pb-2">
            <Button
               className="w-full"
               disabled={!isValid || createMutation.isPending}
               onClick={handleCreate}
            >
               {createMutation.isPending ? (
                  <Spinner className="size-4 mr-2" />
               ) : null}
               Criar chave
            </Button>
         </div>
      </div>
   );
}
