import type { Content } from "@packages/database/schemas/content";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Switch } from "@packages/ui/components/switch";
import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useClusterEmbedSettings } from "../hooks/use-cluster-embed-settings";

interface Props {
   cluster: Content;
   onSaved?: () => void;
}

export function ClusterEmbedPanel({ cluster, onSaved }: Props) {
   const cfg = cluster.clusterConfig ?? {};
   const [embedEnabled, setEmbedEnabled] = useState(cfg.embedEnabled ?? false);
   const [theme, setTheme] = useState<"light" | "dark" | "auto">(
      cfg.embedSettings?.theme ?? "auto",
   );
   const [label, setLabel] = useState(cfg.embedSettings?.label ?? "What's New");
   const [accentColor, setAccentColor] = useState(
      cfg.embedSettings?.accentColor ?? "#6366f1",
   );

   const updateMutation = useClusterEmbedSettings();

   const snippet = `<script\n  src="https://cdn.contentta.com/embed.js"\n  data-api-key="sk_..."\n  data-cluster-id="${cluster.id}"\n  data-theme="${theme}"\n></script>`;

   const handleSave = () => {
      updateMutation.mutate(
         {
            id: cluster.id,
            clusterConfig: {
               embedEnabled,
               embedSettings: { theme, label, accentColor },
            },
         },
         { onSuccess: onSaved },
      );
   };

   const copySnippet = () => {
      navigator.clipboard.writeText(snippet);
      toast.success("Snippet copiado!");
   };

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <p className="font-medium">Embed ativado</p>
               <p className="text-sm text-muted-foreground">
                  Permite incorporar este cluster em sites externos.
               </p>
            </div>
            <Switch checked={embedEnabled} onCheckedChange={setEmbedEnabled} />
         </div>

         {embedEnabled && (
            <>
               <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex gap-2">
                     {(["light", "dark", "auto"] as const).map((t) => (
                        <button
                           className={`px-3 py-1 rounded-md border text-sm ${
                              theme === t
                                 ? "border-primary bg-primary/10"
                                 : "border-input"
                           }`}
                           key={t}
                           onClick={() => setTheme(t)}
                           type="button"
                        >
                           {t}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <Label htmlFor="embed-label">Label do badge</Label>
                  <Input
                     id="embed-label"
                     onChange={(e) => setLabel(e.target.value)}
                     placeholder="What's New"
                     value={label}
                  />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="embed-accent">Cor de destaque</Label>
                  <Input
                     className="h-10 w-20"
                     id="embed-accent"
                     onChange={(e) => setAccentColor(e.target.value)}
                     type="color"
                     value={accentColor}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Script de embed</Label>
                  <div className="relative">
                     <pre className="text-xs bg-muted rounded-md p-3 pr-10 overflow-x-auto">
                        {snippet}
                     </pre>
                     <button
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                        onClick={copySnippet}
                        type="button"
                     >
                        <Copy className="size-4" />
                     </button>
                  </div>
               </div>
            </>
         )}

         <Button disabled={updateMutation.isPending} onClick={handleSave}>
            {updateMutation.isPending && (
               <Loader2 className="size-4 mr-2 animate-spin" />
            )}
            Salvar
         </Button>
      </div>
   );
}
