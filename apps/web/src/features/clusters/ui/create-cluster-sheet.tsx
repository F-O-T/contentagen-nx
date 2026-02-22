import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import { useBatchGenerate } from "../hooks/use-batch-generate";

interface SatelliteEntry {
   title: string;
   description: string;
}

interface Props {
   onSuccess?: (pillarId: string) => void;
}

export function CreateClusterSheet({ onSuccess }: Props) {
   const { closeSheet } = useSheet();
   const [step, setStep] = useState<"describe" | "confirm">("describe");
   const [description, setDescription] = useState("");
   const [pillarTitle, setPillarTitle] = useState("");
   const [mode, setMode] = useState("");
   const [embedEnabled, setEmbedEnabled] = useState(false);
   const [satellites, setSatellites] = useState<SatelliteEntry[]>([]);

   const suggestMutation = useMutation(
      orpc.clusters.suggestStructure.mutationOptions({
         onSuccess: (data) => {
            setPillarTitle(data.pillarTitle);
            setMode(data.mode);
            setEmbedEnabled(data.embedEnabled);
            setSatellites(data.satellites);
            setStep("confirm");
         },
         onError: () => toast.error("Erro ao gerar sugestão. Tente novamente."),
      }),
   );

   const createMutation = useBatchGenerate();

   const handleSuggest = () => {
      if (!description.trim()) return;
      suggestMutation.mutate({ description });
   };

   const handleCreate = () => {
      createMutation.mutate(
         {
            pillarTitle,
            mode,
            embedEnabled,
            satellites: satellites.map((s) => ({ title: s.title })),
         },
         {
            onSuccess: (data) => {
               closeSheet();
               onSuccess?.(data.pillar.id);
            },
         },
      );
   };

   const removeSatellite = (index: number) => {
      setSatellites((prev) => prev.filter((_, i) => i !== index));
   };

   if (step === "describe") {
      return (
         <div className="space-y-6 p-6">
            <div>
               <h2 className="text-lg font-semibold">Novo Cluster</h2>
               <p className="text-sm text-muted-foreground mt-1">
                  Descreva seu objetivo e a IA vai sugerir a estrutura do
                  cluster.
               </p>
            </div>
            <div className="space-y-2">
               <Label htmlFor="cluster-description">Objetivo do cluster</Label>
               <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  id="cluster-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Quero documentar atualizações do produto para meus usuários"
                  value={description}
               />
            </div>
            <div className="flex gap-2">
               <Button
                  className="flex-1"
                  disabled={!description.trim() || suggestMutation.isPending}
                  onClick={handleSuggest}
               >
                  {suggestMutation.isPending ? (
                     <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                     <Sparkles className="size-4 mr-2" />
                  )}
                  Sugerir estrutura
               </Button>
               <Button onClick={closeSheet} variant="outline">
                  Cancelar
               </Button>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
               Prefere criar manualmente?{" "}
               <button
                  className="underline"
                  onClick={() => setStep("confirm")}
                  type="button"
               >
                  Pular sugestão
               </button>
            </p>
         </div>
      );
   }

   return (
      <div className="space-y-6 p-6">
         <div>
            <h2 className="text-lg font-semibold">Confirmar estrutura</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Revise e edite antes de criar.
            </p>
         </div>
         <div className="space-y-2">
            <Label htmlFor="pillar-title">Título do post pillar</Label>
            <Input
               id="pillar-title"
               onChange={(e) => setPillarTitle(e.target.value)}
               placeholder="Título principal"
               value={pillarTitle}
            />
         </div>
         <div className="space-y-2">
            <Label htmlFor="cluster-mode">Tipo de cluster</Label>
            <Input
               id="cluster-mode"
               onChange={(e) => setMode(e.target.value)}
               placeholder="ex: changelog, seo, series"
               value={mode}
            />
         </div>
         <div className="space-y-2">
            <p className="text-sm font-medium">
               Posts satélite ({satellites.length})
            </p>
            {satellites.map((s, i) => (
               <div
                  className="flex items-start gap-2 p-2 border rounded-md"
                  key={`sat-${i + 1}`}
               >
                  <div className="flex-1 space-y-1">
                     <Input
                        className="text-sm"
                        onChange={(e) => {
                           const next = [...satellites];
                           next[i] = { ...next[i], title: e.target.value };
                           setSatellites(next);
                        }}
                        placeholder="Título do satélite"
                        value={s.title}
                     />
                     <p className="text-xs text-muted-foreground px-1">
                        {s.description}
                     </p>
                  </div>
                  <button
                     className="text-muted-foreground hover:text-destructive mt-1"
                     onClick={() => removeSatellite(i)}
                     type="button"
                  >
                     <X className="size-4" />
                  </button>
               </div>
            ))}
            <Button
               onClick={() =>
                  setSatellites((prev) => [
                     ...prev,
                     { title: "", description: "" },
                  ])
               }
               size="sm"
               variant="outline"
            >
               + Adicionar satélite
            </Button>
         </div>
         <div className="flex gap-2">
            <Button
               className="flex-1"
               disabled={!pillarTitle.trim() || createMutation.isPending}
               onClick={handleCreate}
            >
               {createMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Criar cluster
            </Button>
            <Button onClick={() => setStep("describe")} variant="outline">
               Voltar
            </Button>
         </div>
      </div>
   );
}
