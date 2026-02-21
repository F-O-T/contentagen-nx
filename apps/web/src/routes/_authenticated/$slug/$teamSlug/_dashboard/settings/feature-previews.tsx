import { FeatureStageBadge } from "@packages/ui/components/feature-stage-badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, FlaskConical, ImageIcon, Lightbulb } from "lucide-react";
import { useEarlyAccess } from "@/hooks/use-early-access";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/feature-previews",
)({
   component: FeaturePreviewsPage,
});

// ---------------------------------------------------------------------------
// Local config — maps parent flagKey to concept sub-feature names.
// Concept sub-features are nested visually under their parent.
// ---------------------------------------------------------------------------
const CONCEPT_CHILDREN: Record<string, string[]> = {
   "asset-bank": ["Geração de Imagens por IA"],
};

const FEATURE_ICONS: Record<string, React.ElementType> = {
   "asset-bank": ImageIcon,
};

function FeaturePreviewsPage() {
   const { features, loaded, isEnrolled, updateEnrollment } = useEarlyAccess();

   const parentFeatures = features.filter((f) => f.stage !== "concept");
   const conceptFeatures = features.filter((f) => f.stage === "concept");

   const conceptByName = new Map(conceptFeatures.map((f) => [f.name, f]));

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Previas de Funcionalidades
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Experimente funcionalidades em fases iniciais antes do lançamento
               oficial. Funcionalidades em{" "}
               <span className="font-medium text-orange-600 dark:text-orange-400">
                  Alpha
               </span>{" "}
               são funcionais mas podem mudar.{" "}
               <span className="font-medium text-purple-600 dark:text-purple-400">
                  Conceitos
               </span>{" "}
               são ideias em exploração, ainda sem data.
            </p>
         </div>

         {!loaded && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
         )}

         {loaded && parentFeatures.length === 0 && (
            <p className="text-sm text-muted-foreground">
               Nenhuma funcionalidade em preview disponível no momento.
            </p>
         )}

         {loaded && parentFeatures.length > 0 && (
            <ItemGroup>
               {parentFeatures.map((feature) => {
                  if (!feature.flagKey) return null;
                  const enrolled = isEnrolled(feature.flagKey);
                  const Icon = FEATURE_ICONS[feature.flagKey] ?? FlaskConical;

                  const childNames = CONCEPT_CHILDREN[feature.flagKey] ?? [];
                  const children = childNames
                     .map((name) => conceptByName.get(name))
                     .filter(Boolean);
                  const hasChildren = children.length > 0;

                  return (
                     <Collapsible
                        key={feature.flagKey}
                        defaultOpen={hasChildren}
                        className="flex flex-col"
                     >
                        <Item variant="muted">
                           <ItemMedia variant="icon">
                              <Icon className="size-4" />
                           </ItemMedia>
                           <ItemContent>
                              <div className="flex items-center gap-2">
                                 <ItemTitle>{feature.name}</ItemTitle>
                                 <FeatureStageBadge
                                    className="text-xs"
                                    stage={feature.stage}
                                 />
                              </div>
                              <ItemDescription>
                                 {feature.description}
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions className="flex items-center gap-2">
                              <Switch
                                 checked={enrolled}
                                 onCheckedChange={(checked) =>
                                    updateEnrollment(feature.flagKey!, checked)
                                 }
                              />
                              {hasChildren && (
                                 <CollapsibleTrigger className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-180">
                                    <ChevronDown className="size-4 transition-transform duration-200" />
                                 </CollapsibleTrigger>
                              )}
                           </ItemActions>
                        </Item>

                        {hasChildren && (
                           <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                              <div className="ml-6 mt-1 flex flex-col border-l border-dashed border-muted-foreground/20 pl-4 pb-2">
                                 {children.map((child) => {
                                    const childEnrolled = child?.flagKey
                                       ? isEnrolled(child.flagKey)
                                       : false;
                                    return (
                                       <Item
                                          key={child?.name}
                                          variant="muted"
                                       >
                                          <ItemMedia variant="icon">
                                             <Lightbulb className="size-4 text-purple-500" />
                                          </ItemMedia>
                                          <ItemContent>
                                             <div className="flex items-center gap-2">
                                                <ItemTitle>{child?.name}</ItemTitle>
                                                <FeatureStageBadge
                                                   className="text-xs"
                                                   stage="concept"
                                                />
                                             </div>
                                             <ItemDescription>
                                                {child?.description}
                                             </ItemDescription>
                                          </ItemContent>
                                          {child?.flagKey && (
                                             <ItemActions>
                                                <Switch
                                                   checked={childEnrolled}
                                                   onCheckedChange={(checked) =>
                                                      updateEnrollment(
                                                         child.flagKey!,
                                                         checked,
                                                      )
                                                   }
                                                />
                                             </ItemActions>
                                          )}
                                       </Item>
                                    );
                                 })}
                              </div>
                           </CollapsibleContent>
                        )}
                     </Collapsible>
                  );
               })}
            </ItemGroup>
         )}
      </div>
   );
}
