import { Badge } from "@packages/ui/components/badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useEarlyAccess } from "@/hooks/use-early-access";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/feature-previews",
)({
   component: FeaturePreviewsPage,
});

const STAGE_LABELS: Record<string, string> = {
   alpha: "Alpha",
   beta: "Beta",
   concept: "Conceito",
};

function FeaturePreviewsPage() {
   const { features, loaded, isEnrolled, updateEnrollment } = useEarlyAccess();

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Previas de Funcionalidades
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Experimente funcionalidades em fase beta antes do lancamento
               oficial.
            </p>
         </div>
         {!loaded && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
         )}
         {loaded && features.length === 0 && (
            <p className="text-sm text-muted-foreground">
               Nenhuma funcionalidade em beta disponivel no momento.
            </p>
         )}
         {loaded && features.length > 0 && (
            <ItemGroup>
               {features.map((feature) => {
                  if (!feature.flagKey) return null;
                  const enrolled = isEnrolled(feature.flagKey);
                  return (
                     <Item key={feature.flagKey} variant="muted">
                        <ItemMedia variant="icon">
                           <FlaskConical className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <div className="flex items-center gap-2">
                              <ItemTitle>{feature.name}</ItemTitle>
                              <Badge className="text-xs" variant="secondary">
                                 <FlaskConical className="size-3 mr-1" />
                                 {STAGE_LABELS[feature.stage] ?? feature.stage}
                              </Badge>
                           </div>
                           <ItemDescription>
                              {feature.description}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <Switch
                              checked={enrolled}
                              onCheckedChange={(checked) =>
                                 updateEnrollment(feature.flagKey!, checked)
                              }
                           />
                        </ItemActions>
                     </Item>
                  );
               })}
            </ItemGroup>
         )}
      </div>
   );
}
