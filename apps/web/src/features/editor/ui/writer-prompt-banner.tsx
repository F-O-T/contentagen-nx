import { Button } from "@packages/ui/components/button";
import { UserRound } from "lucide-react";
import { useSafeLocalStorage } from "@/hooks/use-local-storage";

interface WriterPromptBannerProps {
   contentId: string;
   writerId: string | null | undefined;
}

export function WriterPromptBanner({
   contentId,
   writerId,
}: WriterPromptBannerProps) {
   const [dismissed, setDismissed] = useSafeLocalStorage(
      `writer-prompt-dismissed-${contentId}`,
      false,
   );

   if (writerId != null) {
      return null;
   }

   if (dismissed) {
      return null;
   }

   const handleSelectWriter = () => {
      // TODO: open writer selector credenza when it exists
      console.log("TODO: open writer selector");
   };

   const handleDismiss = () => {
      setDismissed(true);
   };

   return (
      <div className="rounded-lg bg-muted/50 p-3 flex flex-col gap-2">
         <div className="flex items-center gap-2">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold">Personalize o escritor</span>
         </div>
         <p className="text-xs text-muted-foreground">
            Com um escritor configurado, o Teco aprende seu tom, estilo e objetivos
            para gerar conteúdo mais alinhado com a sua voz.
         </p>
         <div className="flex items-center gap-2">
            <Button onClick={handleSelectWriter} size="sm" variant="outline">
               Selecionar escritor
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="ghost">
               Pular
            </Button>
         </div>
      </div>
   );
}