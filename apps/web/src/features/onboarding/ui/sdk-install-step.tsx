import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

export function SdkInstallStep() {
   const navigate = useNavigate();
   const { slug } = useParams({ from: "/_authenticated/$slug/onboarding" });

   const { data: status } = useQuery(
      orpc.onboarding.getOnboardingStatus.queryOptions({}),
   );
   const { data: org } = useQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );
   const { data: teams } = useQuery(
      orpc.organization.getOrganizationTeams.queryOptions({}),
   );

   const [copiedKey, setCopiedKey] = useState(false);
   const [copiedInstall, setCopiedInstall] = useState(false);
   const [copiedCode, setCopiedCode] = useState(false);

   const completeMutation = useMutation(
      orpc.onboarding.completeProjectOnboarding.mutationOptions({
         onSuccess: () => {
            const teamId = teams?.[0]?.id ?? "";
            navigate({ to: "/$slug/$teamId/home", params: { slug, teamId } });
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao concluir onboarding.");
         },
      }),
   );

   const teamId = teams?.[0]?.id;
   const { data: publicKeyData } = useQuery(
      orpc.team.getPublicApiKey.queryOptions({
         input: { teamId: teamId! },
         enabled: !!teamId,
      }),
   );

   const publicApiKey = publicKeyData?.publicApiKey ?? "cta_pub_...";
   const organizationId = org?.id ?? "org_...";

   const installSnippet = "npm install @contentta/sdk";

   const codeSnippet = `import { createEventTracker } from "@contentta/sdk/events";

const tracker = createEventTracker({
  apiKey: "${publicApiKey}",
  organizationId: "${organizationId}",
});

tracker.autoTrackPageViews("content-id", "content-slug");`;

   const copyToClipboard = useCallback(
      async (text: string, setter: (v: boolean) => void) => {
         await navigator.clipboard.writeText(text);
         setter(true);
         setTimeout(() => setter(false), 2000);
      },
      [],
   );

   const handleComplete = useCallback(() => {
      completeMutation.mutate({});
   }, [completeMutation]);

   const handleSkip = useCallback(() => {
      completeMutation.mutate({});
   }, [completeMutation]);

   return (
      <div className="space-y-6">
         <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl font-semibold">Instale o SDK</h2>
            <p className="text-sm text-muted-foreground">
               Adicione o SDK ao seu site para coletar dados e exibir
               formularios.
            </p>
         </div>

         {/* API Key */}
         <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="api-key">
               Chave publica da API
            </label>
            <div className="flex gap-2">
               <Input
                  className="font-mono text-sm"
                  id="api-key"
                  readOnly
                  value={publicApiKey}
               />
               <Button
                  onClick={() => copyToClipboard(publicApiKey, setCopiedKey)}
                  size="icon"
                  type="button"
                  variant="outline"
               >
                  {copiedKey ? (
                     <Check className="size-4" />
                  ) : (
                     <Copy className="size-4" />
                  )}
               </Button>
            </div>
         </div>

         {/* Install command */}
         <div className="space-y-2">
            <p className="text-sm font-medium">1. Instale o pacote</p>
            <div className="relative">
               <pre className="rounded-lg border bg-muted p-3 font-mono text-sm">
                  <code>{installSnippet}</code>
               </pre>
               <Button
                  className="absolute top-2 right-2"
                  onClick={() =>
                     copyToClipboard(installSnippet, setCopiedInstall)
                  }
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  {copiedInstall ? (
                     <Check className="size-4" />
                  ) : (
                     <Copy className="size-4" />
                  )}
               </Button>
            </div>
         </div>

         {/* Code snippet */}
         <div className="space-y-2">
            <p className="text-sm font-medium">2. Inicialize o tracker</p>
            <div className="relative">
               <pre className="overflow-x-auto rounded-lg border bg-muted p-3 font-mono text-xs leading-relaxed">
                  <code>{codeSnippet}</code>
               </pre>
               <Button
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(codeSnippet, setCopiedCode)}
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  {copiedCode ? (
                     <Check className="size-4" />
                  ) : (
                     <Copy className="size-4" />
                  )}
               </Button>
            </div>
         </div>

         {/* Actions */}
         <div className="space-y-3">
            <Button
               className="h-11 w-full"
               disabled={completeMutation.isPending}
               onClick={handleComplete}
            >
               {completeMutation.isPending ? (
                  <Spinner className="size-4" />
               ) : (
                  "Concluir"
               )}
            </Button>
            <button
               className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
               disabled={completeMutation.isPending}
               onClick={handleSkip}
               type="button"
            >
               Pular por enquanto
            </button>
         </div>
      </div>
   );
}
