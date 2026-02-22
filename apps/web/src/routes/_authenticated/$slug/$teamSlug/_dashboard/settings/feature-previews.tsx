import { Button } from "@packages/ui/components/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import {
   type FeatureStage,
   FeatureStageBadge,
   FeatureStageChip,
} from "@packages/ui/components/feature-stage-badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, FlaskConical, ImageIcon, Lightbulb } from "lucide-react";
import { Fragment, useState } from "react";
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

   // Filter state - starts with all stages selected
   const [selectedStages, setSelectedStages] = useState<Set<FeatureStage>>(
      new Set(["concept", "alpha", "beta", "general-availability"]),
   );

   const toggleStage = (stage: FeatureStage) => {
      setSelectedStages((prev) => {
         const next = new Set(prev);
         if (next.has(stage)) {
            // Don't allow empty filter - if trying to deselect last one, keep it
            if (next.size === 1) return prev;
            next.delete(stage);
         } else {
            next.add(stage);
         }
         return next;
      });
   };

   // Names explicitly listed as children under a parent — always shown nested.
   const childNames = new Set(Object.values(CONCEPT_CHILDREN).flat());

   // Top-level: has a flagKey AND is not a named child of another feature.
   const parentFeatures = features.filter(
      (f) => f.flagKey !== null && !childNames.has(f.name),
   );
   // Children: by name, regardless of flagKey.
   const conceptFeatures = features.filter((f) => childNames.has(f.name));

   const conceptByName = new Map(conceptFeatures.map((f) => [f.name, f]));

   // Filter features by selected stages
   const filteredFeatures = parentFeatures.filter((f) =>
      selectedStages.has(f.stage),
   );

   // Count features per stage for the filter labels
   const stageCounts = {
      concept: features.filter((f) => f.stage === "concept").length,
      alpha: features.filter((f) => f.stage === "alpha").length,
      beta: features.filter((f) => f.stage === "beta").length,
      "general-availability": features.filter(
         (f) => f.stage === "general-availability",
      ).length,
   };

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Prévias de funcionalidades
            </h1>
            <p className="text-sm text-muted-foreground mt-3">
               As prévias permitem experimentar funcionalidades antes do
               lançamento oficial. Cada recurso passa por estágios de
               maturidade.
            </p>

            {/* Filter Bar */}
            <div className=" space-y-2">
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Filtrar por estágio:</span>
                  <Button
                     className="px-0"
                     onClick={() =>
                        setSelectedStages(
                           new Set([
                              "concept",
                              "alpha",
                              "beta",
                              "general-availability",
                           ]),
                        )
                     }
                     size="sm"
                     variant="link"
                  >
                     Mostrar todos
                  </Button>
               </div>
               <div className="flex flex-wrap gap-2">
                  <FeatureStageChip
                     count={stageCounts.concept}
                     isActive={selectedStages.has("concept")}
                     onClick={() => toggleStage("concept")}
                     stage="concept"
                  />
                  <FeatureStageChip
                     count={stageCounts.alpha}
                     isActive={selectedStages.has("alpha")}
                     onClick={() => toggleStage("alpha")}
                     stage="alpha"
                  />
                  <FeatureStageChip
                     count={stageCounts.beta}
                     isActive={selectedStages.has("beta")}
                     onClick={() => toggleStage("beta")}
                     stage="beta"
                  />
                  <FeatureStageChip
                     count={stageCounts["general-availability"]}
                     isActive={selectedStages.has("general-availability")}
                     onClick={() => toggleStage("general-availability")}
                     stage="general-availability"
                  />
               </div>
            </div>
         </div>

         {!loaded && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
         )}

         {loaded && filteredFeatures.length === 0 && (
            <p className="text-sm text-muted-foreground">
               Nenhuma funcionalidade encontrada com os filtros selecionados.
            </p>
         )}

         {loaded && filteredFeatures.length > 0 && (
            <ItemGroup>
               {filteredFeatures.map((feature, index) => {
                  if (!feature.flagKey) return null;
                  const enrolled = isEnrolled(feature.flagKey);
                  const Icon = FEATURE_ICONS[feature.flagKey] ?? FlaskConical;

                  const childNames = CONCEPT_CHILDREN[feature.flagKey] ?? [];
                  const children = childNames
                     .map((name) => conceptByName.get(name))
                     .filter(Boolean);
                  const hasChildren = children.length > 0;

                  return (
                     <Fragment key={feature.flagKey}>
                        {index > 0 && <ItemSeparator />}

                        <Collapsible
                           className="flex flex-col"
                           defaultOpen={true}
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
                              <ItemActions>
                                 <Switch
                                    checked={enrolled}
                                    onCheckedChange={(checked) => {
                                       updateEnrollment(
                                          feature.flagKey ?? "",
                                          checked,
                                       );
                                       if (!checked) {
                                          for (const child of children) {
                                             if (child?.flagKey) {
                                                updateEnrollment(
                                                   child.flagKey,
                                                   false,
                                                );
                                             }
                                          }
                                       }
                                    }}
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
                                 <ItemSeparator />
                                 <ItemGroup className="ml-10">
                                    {children.map((child, childIndex) => {
                                       const childEnrolled = child?.flagKey
                                          ? isEnrolled(child.flagKey)
                                          : false;
                                       return (
                                          <Fragment key={child?.name}>
                                             {childIndex > 0 && (
                                                <ItemSeparator />
                                             )}
                                             <Item variant="muted">
                                                <ItemMedia variant="icon">
                                                   <Lightbulb className="size-4 text-purple-500" />
                                                </ItemMedia>
                                                <ItemContent>
                                                   <div className="flex items-center gap-2">
                                                      <ItemTitle>
                                                         {child?.name}
                                                      </ItemTitle>
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
                                                         disabled={!enrolled}
                                                         onCheckedChange={(
                                                            checked,
                                                         ) =>
                                                            updateEnrollment(
                                                               child.flagKey ??
                                                                  "",
                                                               checked,
                                                            )
                                                         }
                                                      />
                                                   </ItemActions>
                                                )}
                                             </Item>
                                          </Fragment>
                                       );
                                    })}
                                 </ItemGroup>
                              </CollapsibleContent>
                           )}
                        </Collapsible>
                     </Fragment>
                  );
               })}
            </ItemGroup>
         )}
      </div>
   );
}
