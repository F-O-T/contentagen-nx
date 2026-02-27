import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { cn } from "@packages/ui/lib/utils";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
   Activity,
   BookOpen,
   ExternalLink,
   Layers,
   Loader2,
   Network,
   Plus,
   Sparkles,
   Trash2,
   X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import {
   ContextPanelAction,
   ContextPanelDivider,
   ContextPanelMeta,
} from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import { AddSatelliteSheet } from "./add-satellite-sheet";
import { ClusterBuilderHeader } from "./cluster-builder-header";
import { ClusterEmbedPanel } from "./cluster-embed-panel";
import type { SatelliteItem } from "./satellite-canvas";
import { SatelliteCanvas } from "./satellite-canvas";

// ─── Mode Options ──────────────────────────────────────────────────────────

const CLUSTER_MODES = [
   {
      value: "seo",
      label: "SEO",
      description: "Cluster voltado para ranqueamento e conteúdo de busca",
      icon: "🔍",
   },
   {
      value: "changelog",
      label: "Changelog",
      description: "Documenta atualizações e mudanças do produto",
      icon: "📋",
   },
   {
      value: "series",
      label: "Série",
      description: "Conteúdo em série com episódios ou partes relacionadas",
      icon: "📚",
   },
] as const;

// ─── AI Assist Panel ────────────────────────────────────────────────────────

interface AIAssistPanelProps {
   onApply: (data: {
      pillarTitle: string;
      mode: string;
      embedEnabled: boolean;
      satellites: { title: string; description: string }[];
   }) => void;
}

function AIAssistPanel({ onApply }: AIAssistPanelProps) {
   const [description, setDescription] = useState("");
   const [dismissed, setDismissed] = useState(false);

   const suggestMutation = useMutation(
      orpc.clusters.suggestStructure.mutationOptions({
         onSuccess: (data) => {
            onApply(data);
            toast.success("Estrutura sugerida pela IA aplicada!");
         },
         onError: () => toast.error("Erro ao gerar sugestão. Tente novamente."),
      }),
   );

   if (dismissed) return null;

   return (
      <Card className="border-dashed border-primary/40 bg-primary/5">
         <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="text-sm font-medium">Assistente IA</p>
               </div>
               <Button
                  aria-label="Fechar assistente IA"
                  className="size-6"
                  onClick={() => setDismissed(true)}
                  size="icon"
                  variant="ghost"
               >
                  <X className="size-3.5" />
               </Button>
            </div>
            <p className="text-xs text-muted-foreground">
               Descreva o objetivo do cluster e a IA sugerirá a estrutura.
            </p>
            <textarea
               className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Ex: Quero documentar atualizações do produto para meus usuários"
               value={description}
            />
            <Button
               className="w-full"
               disabled={!description.trim() || suggestMutation.isPending}
               onClick={() => suggestMutation.mutate({ description })}
               size="sm"
            >
               {suggestMutation.isPending ? (
                  <Loader2 className="size-3.5 mr-2 animate-spin" />
               ) : (
                  <Sparkles className="size-3.5 mr-2" />
               )}
               Sugerir estrutura
            </Button>
         </CardContent>
      </Card>
   );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

interface OverviewTabProps {
   mode: string;
   onModeChange: (mode: string) => void;
   pillarTitle: string;
   pillarId?: string;
   pillarStatus?: string;
   showAiAssist: boolean;
   onAiApply: (data: {
      pillarTitle: string;
      mode: string;
      embedEnabled: boolean;
      satellites: { title: string; description: string }[];
   }) => void;
}

function OverviewTab({
   mode,
   onModeChange,
   pillarId,
   pillarStatus,
   showAiAssist,
   onAiApply,
}: OverviewTabProps) {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   return (
      <div className="space-y-6 max-w-2xl">
         {showAiAssist && <AIAssistPanel onApply={onAiApply} />}

         <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de cluster</Label>
            <div className="grid grid-cols-3 gap-3">
               {CLUSTER_MODES.map((m) => (
                  <button
                     className={cn(
                        "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                        mode === m.value
                           ? "border-primary bg-primary/10 ring-1 ring-primary"
                           : "border-input hover:border-muted-foreground/50 hover:bg-accent/30",
                     )}
                     key={m.value}
                     onClick={() => onModeChange(m.value)}
                     type="button"
                  >
                     <span className="text-lg mb-1">{m.icon}</span>
                     <span className="text-sm font-medium">{m.label}</span>
                     <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {m.description}
                     </span>
                  </button>
               ))}
            </div>
         </div>

         {pillarId && (
            <>
               <Separator />
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-sm font-medium">Post Pillar</p>
                     <p className="text-xs text-muted-foreground mt-0.5">
                        O conteúdo principal deste cluster
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                     {pillarStatus && (
                        <Badge
                           variant={
                              pillarStatus === "published"
                                 ? "default"
                                 : "outline"
                           }
                        >
                           {pillarStatus === "published"
                              ? "Publicado"
                              : "Rascunho"}
                        </Badge>
                     )}
                     <Button
                        onClick={() =>
                           navigate({
                              to: "/$slug/$teamSlug/$contentId",
                              params: { slug, teamSlug, contentId: pillarId },
                           })
                        }
                        size="sm"
                        variant="outline"
                     >
                        <ExternalLink className="size-3.5 mr-1.5" />
                        Abrir editor
                     </Button>
                  </div>
               </div>
            </>
         )}
      </div>
   );
}

// ─── Satellites Tab ────────────────────────────────────────────────────────

interface SatellitesTabProps {
   pillarId: string;
   satellites: SatelliteItem[];
   onReorder: (items: SatelliteItem[]) => void;
   onRemove: (contentId: string) => void;
   isRemoving: boolean;
   onRefetch: () => void;
}

function SatellitesTab({
   pillarId,
   satellites,
   onReorder,
   onRemove,
   isRemoving,
   onRefetch,
}: SatellitesTabProps) {
   const { openSheet } = useSheet();

   const published = satellites.filter((s) => s.status === "published").length;
   const drafts = satellites.filter((s) => s.status !== "published").length;

   return (
      <div className="flex gap-6 items-start">
         {/* Sidebar Panel */}
         <div className="w-[280px] shrink-0 space-y-4">
            <Card className="sticky top-4">
               <CardContent className="p-4 space-y-4">
                  <div>
                     <p className="text-sm font-semibold">Adicionar satélite</p>
                  </div>
                  <div className="flex flex-col gap-2">
                     <Button
                        className="w-full justify-start"
                        onClick={() =>
                           openSheet({
                              children: (
                                 <AddSatelliteSheet
                                    onSuccess={onRefetch}
                                    pillarId={pillarId}
                                 />
                              ),
                           })
                        }
                        size="sm"
                        variant="outline"
                     >
                        <BookOpen className="size-3.5 mr-2" />
                        Conteúdo existente
                     </Button>
                  </div>

                  {satellites.length > 0 && (
                     <>
                        <Separator />
                        <div className="space-y-1.5">
                           <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Satélites
                           </p>
                           <div className="flex gap-3 text-sm">
                              <span className="text-muted-foreground">
                                 <span className="font-medium text-foreground">
                                    {published}
                                 </span>{" "}
                                 publicados
                              </span>
                              <span className="text-muted-foreground">
                                 <span className="font-medium text-foreground">
                                    {drafts}
                                 </span>{" "}
                                 rascunhos
                              </span>
                           </div>
                        </div>
                     </>
                  )}
               </CardContent>
            </Card>
         </div>

         {/* Canvas */}
         <div className="flex-1 min-w-0">
            <SatelliteCanvas
               isRemoving={isRemoving}
               onRemove={onRemove}
               onReorder={onReorder}
               satellites={satellites}
            />
            <div className="mt-3">
               <Button
                  onClick={() =>
                     openSheet({
                        children: (
                           <AddSatelliteSheet
                              onSuccess={onRefetch}
                              pillarId={pillarId}
                           />
                        ),
                     })
                  }
                  size="sm"
                  variant="ghost"
               >
                  <Plus className="size-3.5 mr-1.5" />
                  Novo post satélite
               </Button>
            </div>
         </div>
      </div>
   );
}

// ─── Cluster Builder (Edit Mode) ─────────────────────────────────────────────

const MODE_LABELS: Record<string, string> = {
   seo: "SEO",
   changelog: "Changelog",
   series: "Série",
};

const STATUS_LABELS: Record<string, string> = {
   draft: "Rascunho",
   published: "Publicado",
};

interface ClusterBuilderEditProps {
   clusterId: string;
}

function ClusterBuilderEdit({ clusterId }: ClusterBuilderEditProps) {
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const { data: cluster, refetch } = useSuspenseQuery(
      orpc.clusters.getById.queryOptions({ input: { id: clusterId } }),
   );

   const { data: satelliteRelations, refetch: refetchSatellites } =
      useSuspenseQuery(
         orpc.relatedContent.listSatellites.queryOptions({
            input: { pillarId: clusterId },
         }),
      );

   const [pillarTitle, setPillarTitle] = useState(cluster.meta.title);
   const [mode, setMode] = useState(cluster.clusterConfig?.mode ?? "seo");

   // Map API response to SatelliteItem[]
   const [satellites, setSatellites] = useState<SatelliteItem[]>(() =>
      satelliteRelations.map((rel) => ({
         id: rel.id,
         contentId: rel.targetContent.id,
         title: rel.targetContent.meta.title,
         status: rel.targetContent.status,
      })),
   );

   const updateMutation = useMutation(
      orpc.clusters.updateConfig.mutationOptions({
         onSuccess: () => {
            toast.success("Cluster atualizado");
            queryClient.invalidateQueries({
               queryKey: orpc.clusters.getById.queryOptions({
                  input: { id: clusterId },
               }).queryKey,
            });
         },
         onError: () => toast.error("Erro ao salvar cluster"),
      }),
   );

   const updateTitleMutation = useMutation(
      orpc.content.update.mutationOptions({
         onError: () => toast.error("Erro ao salvar título"),
      }),
   );

   const removeMutation = useMutation(
      orpc.relatedContent.removeSatellite.mutationOptions({
         onSuccess: () => {
            toast.success("Satélite removido");
            refetchSatellites();
         },
         onError: () => toast.error("Erro ao remover satélite"),
      }),
   );

   const reorderMutation = useMutation(
      orpc.relatedContent.reorderSatellites.mutationOptions({
         onError: () => toast.error("Erro ao reordenar satélites"),
      }),
   );

   const handleSave = useCallback(() => {
      updateMutation.mutate({
         id: clusterId,
         clusterConfig: { mode },
      });

      if (pillarTitle !== cluster.meta.title) {
         updateTitleMutation.mutate({
            id: clusterId,
            data: { meta: { title: pillarTitle } },
         });
      }
   }, [
      clusterId,
      mode,
      pillarTitle,
      cluster.meta.title,
      updateMutation,
      updateTitleMutation,
   ]);

   const handleDelete = useCallback(() => {
      openAlertDialog({
         title: "Deletar cluster?",
         description:
            "Isso não pode ser desfeito. Os posts satélite não serão deletados, apenas desvinculados.",
         actionLabel: "Deletar",
         variant: "destructive",
         onAction: () => {
            navigate({
               to: "/$slug/$teamSlug/clusters",
               params: { slug, teamSlug },
            });
         },
      });
   }, [openAlertDialog, navigate, slug, teamSlug]);

   const handleReorder = useCallback(
      (reordered: SatelliteItem[]) => {
         setSatellites(reordered);
         reorderMutation.mutate({
            pillarId: clusterId,
            orderedSatelliteIds: reordered.map((s) => s.contentId),
         });
      },
      [clusterId, reorderMutation],
   );

   const handleRemove = useCallback(
      (contentId: string) => {
         removeMutation.mutate({ pillarId: clusterId, satelliteId: contentId });
         setSatellites((prev) => prev.filter((s) => s.contentId !== contentId));
      },
      [clusterId, removeMutation],
   );

   const handleAiApply = useCallback(
      (data: {
         pillarTitle: string;
         mode: string;
         embedEnabled: boolean;
         satellites: { title: string; description: string }[];
      }) => {
         setPillarTitle(data.pillarTitle);
         setMode(data.mode);
      },
      [],
   );

   useContextPanelInfo(
      <ContextPanel>
         <ContextPanelHeader>
            <ContextPanelTitle>{pillarTitle || cluster.meta.title}</ContextPanelTitle>
         </ContextPanelHeader>
         <ContextPanelContent>
            <ContextPanelMeta
               icon={Layers}
               label="Modo"
               value={MODE_LABELS[mode] ?? mode}
            />
            <ContextPanelMeta
               icon={Activity}
               label="Status"
               value={STATUS_LABELS[cluster.status] ?? cluster.status}
            />
            <ContextPanelMeta
               icon={Network}
               label="Satélites"
               value={satellites.length}
            />
            <ContextPanelDivider />
            <ContextPanelAction
               icon={Trash2}
               label="Deletar cluster"
               onClick={handleDelete}
               variant="destructive"
            />
         </ContextPanelContent>
      </ContextPanel>,
   );

   return (
      <div className="flex flex-col h-full">
         <ClusterBuilderHeader
            isNew={false}
            isSaving={updateMutation.isPending || updateTitleMutation.isPending}
            onDelete={handleDelete}
            onSave={handleSave}
            onTitleChange={setPillarTitle}
            pillarTitle={pillarTitle}
         />

         <Tabs className="w-full flex flex-col flex-1" defaultValue="overview">
            <div className="border-b bg-background">
               <div className="container mx-auto px-4">
                  <TabsList className="h-auto bg-transparent rounded-none p-0 gap-0">
                     <TabsTrigger
                        className="px-4 py-2.5 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground"
                        value="overview"
                     >
                        Visão Geral
                     </TabsTrigger>
                     <TabsTrigger
                        className="px-4 py-2.5 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground"
                        value="satellites"
                     >
                        Posts Satélite
                     </TabsTrigger>
                     <TabsTrigger
                        className="px-4 py-2.5 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground"
                        value="embed"
                     >
                        Embed
                     </TabsTrigger>
                  </TabsList>
               </div>
            </div>

            <div className="flex-1 overflow-auto">
               <div className="container mx-auto px-4 py-6">
                  <TabsContent value="overview">
                     <OverviewTab
                        mode={mode}
                        onAiApply={handleAiApply}
                        onModeChange={setMode}
                        pillarId={clusterId}
                        pillarStatus={cluster.status}
                        pillarTitle={pillarTitle}
                        showAiAssist={satellites.length === 0}
                     />
                  </TabsContent>

                  <TabsContent value="satellites">
                     <SatellitesTab
                        isRemoving={removeMutation.isPending}
                        onRefetch={() => {
                           refetchSatellites().then((result) => {
                              if (result.data) {
                                 setSatellites(
                                    result.data.map((rel) => ({
                                       id: rel.id,
                                       contentId: rel.targetContent.id,
                                       title: rel.targetContent.meta.title,
                                       status: rel.targetContent.status,
                                    })),
                                 );
                              }
                           });
                        }}
                        onRemove={handleRemove}
                        onReorder={handleReorder}
                        pillarId={clusterId}
                        satellites={satellites}
                     />
                  </TabsContent>

                  <TabsContent value="embed">
                     <ClusterEmbedPanel
                        cluster={cluster}
                        onSaved={() => refetch()}
                     />
                  </TabsContent>
               </div>
            </div>
         </Tabs>
      </div>
   );
}

// ─── Cluster Builder (Create Mode) ───────────────────────────────────────────

function ClusterBuilderNew() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const queryClient = useQueryClient();

   const [pillarTitle, setPillarTitle] = useState("");
   const [mode, setMode] = useState("seo");
   const [pendingSatellites, setPendingSatellites] = useState<
      { title: string; description: string }[]
   >([]);

   const createMutation = useMutation(
      orpc.clusters.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Cluster criado!");
            queryClient.invalidateQueries({
               queryKey: orpc.clusters.list.queryKey({}),
            });
            navigate({
               to: "/$slug/$teamSlug/clusters/$clusterId",
               params: { slug, teamSlug, clusterId: data.pillar.id },
            });
         },
         onError: () => toast.error("Erro ao criar cluster"),
      }),
   );

   const handleSave = useCallback(() => {
      if (!pillarTitle.trim()) {
         toast.error("O título do cluster é obrigatório");
         return;
      }
      createMutation.mutate({
         pillarTitle: pillarTitle.trim(),
         mode,
         embedEnabled: false,
         satellites: pendingSatellites.map((s) => ({ title: s.title })),
      });
   }, [pillarTitle, mode, pendingSatellites, createMutation]);

   const handleAiApply = useCallback(
      (data: {
         pillarTitle: string;
         mode: string;
         embedEnabled: boolean;
         satellites: { title: string; description: string }[];
      }) => {
         setPillarTitle(data.pillarTitle);
         setMode(data.mode);
         setPendingSatellites(data.satellites);
      },
      [],
   );

   return (
      <div className="flex flex-col h-full">
         <ClusterBuilderHeader
            isNew={true}
            isSaving={createMutation.isPending}
            onSave={handleSave}
            onTitleChange={setPillarTitle}
            pillarTitle={pillarTitle}
         />

         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 space-y-8">
               <OverviewTab
                  mode={mode}
                  onAiApply={handleAiApply}
                  onModeChange={setMode}
                  pillarTitle={pillarTitle}
                  showAiAssist={true}
               />

               {pendingSatellites.length > 0 && (
                  <div className="space-y-3 max-w-2xl">
                     <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                           Posts satélite sugeridos ({pendingSatellites.length})
                        </p>
                        <Button
                           onClick={() => setPendingSatellites([])}
                           size="sm"
                           variant="ghost"
                        >
                           Limpar
                        </Button>
                     </div>
                     <div className="space-y-2">
                        {pendingSatellites.map((s, i) => (
                           <div
                              className="flex items-start gap-2 p-3 border rounded-lg bg-card"
                              key={`pending-sat-${i + 1}`}
                           >
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium">
                                    {s.title}
                                 </p>
                                 {s.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                       {s.description}
                                    </p>
                                 )}
                              </div>
                              <Button
                                 aria-label="Remover satélite sugerido"
                                 onClick={() =>
                                    setPendingSatellites((prev) =>
                                       prev.filter((_, idx) => idx !== i),
                                    )
                                 }
                                 size="sm"
                                 variant="ghost"
                              >
                                 <X className="size-3.5" />
                              </Button>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface ClusterBuilderProps {
   clusterId?: string;
}

export function ClusterBuilder({ clusterId }: ClusterBuilderProps) {
   if (clusterId) {
      return <ClusterBuilderEdit clusterId={clusterId} />;
   }
   return <ClusterBuilderNew />;
}
