import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { MultiSelect } from "@packages/ui/components/multi-select";
import {
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Spinner } from "@packages/ui/components/spinner";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

interface WebhookFormProps {
   mode: "create" | "edit";
   webhook?: {
      id: string;
      url: string;
      description?: string | null;
      eventPatterns: string[];
      isActive: boolean;
   };
   eventCatalog: {
      eventName: string;
      displayName: string;
      category: string;
      isActive: boolean;
   }[];
   onSuccess: (result?: { plaintextSecret?: string; url?: string }) => void;
}

export function WebhookForm({
   mode,
   webhook,
   eventCatalog,
   onSuccess,
}: WebhookFormProps) {
   const queryClient = useQueryClient();
   const [url, setUrl] = useState(webhook?.url ?? "");
   const [description, setDescription] = useState(webhook?.description ?? "");
   const [eventPatterns, setEventPatterns] = useState<string[]>(
      webhook?.eventPatterns ?? [],
   );
   const [isActive, setIsActive] = useState<boolean>(webhook?.isActive ?? true);

   const options = useMemo(
      () =>
         eventCatalog
            .filter((event) => event.isActive)
            .map((event) => ({
               label: `${event.displayName} (${event.eventName})`,
               value: event.eventName,
               icon: (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                     {event.category}
                  </span>
               ),
            })),
      [eventCatalog],
   );

   const createMutation = useMutation(
      orpc.webhooks.create.mutationOptions({
         onSuccess: (data) => {
            queryClient.invalidateQueries({
               queryKey: orpc.webhooks.list.queryOptions({}).queryKey,
            });
            toast.success("Webhook criado com sucesso");
            onSuccess({
               plaintextSecret: data.plaintextSecret,
               url: data.endpoint.url,
            });
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao criar webhook");
         },
      }),
   );

   const updateMutation = useMutation(
      orpc.webhooks.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.webhooks.list.queryOptions({}).queryKey,
            });
            toast.success("Webhook atualizado com sucesso");
            onSuccess();
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao atualizar webhook");
         },
      }),
   );

   const isValid = url.trim().length > 0 && eventPatterns.length > 0;
   const isPending = createMutation.isPending || updateMutation.isPending;

   function handleSubmit() {
      if (!isValid) return;
      const trimmedUrl = url.trim();
      const trimmedDescription = description.trim();
      const payload = {
         url: trimmedUrl,
         description: trimmedDescription,
         eventPatterns,
         isActive,
      };

      if (mode === "create") {
         createMutation.mutate({
            url: payload.url,
            description: payload.description || undefined,
            eventPatterns: payload.eventPatterns,
         });
         return;
      }

      if (!webhook) return;
      updateMutation.mutate({ id: webhook.id, ...payload });
   }

   return (
      <div className="flex h-full flex-col">
         <SheetHeader>
            <SheetTitle>
               {mode === "create" ? "Criar webhook" : "Editar webhook"}
            </SheetTitle>
            <SheetDescription>
               Configure a URL e os eventos que serão entregues para este
               endpoint.
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 overflow-y-auto space-y-6 py-6">
            <div className="space-y-2 px-1">
               <Label htmlFor="webhook-url">URL do endpoint</Label>
               <Input
                  id="webhook-url"
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.seusite.com/webhooks/contentta"
                  value={url}
               />
            </div>

            <div className="space-y-2 px-1">
               <Label htmlFor="webhook-description">Descrição</Label>
               <Textarea
                  id="webhook-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Integração com CRM, pipeline de dados..."
                  rows={3}
                  value={description}
               />
            </div>

            <div className="space-y-3 px-1">
               <div className="flex items-center justify-between">
                  <div>
                     <Label>Eventos</Label>
                     <p className="text-xs text-muted-foreground mt-1">
                        Selecione eventos específicos do catálogo.
                     </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                     <Zap className="size-4" />
                     {eventPatterns.length} selecionado(s)
                  </div>
               </div>
               <MultiSelect
                  emptyMessage="Nenhum evento disponível"
                  onChange={setEventPatterns}
                  options={options}
                  placeholder="Escolha eventos..."
                  selected={eventPatterns}
               />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 px-4">
               <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                     <Globe className="size-4 text-muted-foreground" />
                     Ativar endpoint
                  </Label>
                  <p className="text-xs text-muted-foreground">
                     Webhooks desativados não recebem novas entregas.
                  </p>
               </div>
               <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
         </div>

         <div className="border-t pt-4 pb-2">
            <Button
               className="w-full"
               disabled={!isValid || isPending}
               onClick={handleSubmit}
            >
               {isPending ? <Spinner className="size-4 mr-2" /> : null}
               {mode === "create" ? "Criar webhook" : "Salvar alterações"}
            </Button>
         </div>
      </div>
   );
}
