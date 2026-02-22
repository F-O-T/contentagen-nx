import { FeatureStageBadge } from "./feature-stage-badge";

/**
 * Showcase component demonstrating all feature stage badge variants
 * Use this for testing and documentation purposes
 */
export function FeatureStageBadgeShowcase() {
   return (
      <div className="space-y-6 p-6">
         <div>
            <h3 className="text-lg font-semibold mb-4">Feature Stage Badges</h3>
            <p className="text-sm text-muted-foreground mb-6">
               Standardized badges for displaying feature development stages
            </p>
         </div>

         <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="w-32 text-sm font-medium">Alpha</div>
               <FeatureStageBadge stage="alpha" />
               <FeatureStageBadge showIcon={false} stage="alpha" />
            </div>

            <div className="flex items-center gap-4">
               <div className="w-32 text-sm font-medium">Beta</div>
               <FeatureStageBadge stage="beta" />
               <FeatureStageBadge showIcon={false} stage="beta" />
            </div>

            <div className="flex items-center gap-4">
               <div className="w-32 text-sm font-medium">Concept</div>
               <FeatureStageBadge stage="concept" />
               <FeatureStageBadge showIcon={false} stage="concept" />
            </div>

            <div className="flex items-center gap-4">
               <div className="w-32 text-sm font-medium">Disponível</div>
               <FeatureStageBadge stage="general-availability" />
               <FeatureStageBadge
                  showIcon={false}
                  stage="general-availability"
               />
            </div>
         </div>

         <div className="mt-8">
            <h4 className="text-sm font-semibold mb-3">Usage Examples</h4>
            <div className="space-y-3 text-sm">
               <div className="flex items-center gap-2 p-3 border rounded-md">
                  <span className="text-foreground">
                     New Analytics Dashboard
                  </span>
                  <FeatureStageBadge stage="beta" />
               </div>

               <div className="flex items-center gap-2 p-3 border rounded-md">
                  <span className="text-foreground">AI Content Generator</span>
                  <FeatureStageBadge stage="alpha" />
               </div>

               <div className="flex items-center gap-2 p-3 border rounded-md">
                  <span className="text-foreground">
                     Real-time Collaboration
                  </span>
                  <FeatureStageBadge stage="beta" />
               </div>
            </div>
         </div>
      </div>
   );
}
