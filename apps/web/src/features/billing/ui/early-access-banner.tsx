import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { FlaskConical } from "lucide-react";
import { useSheet } from "@/hooks/use-sheet";
import { FeatureFeedbackForm } from "@/features/feedback/ui/feature-feedback-form";

export type EarlyAccessBannerTemplate = {
   badgeLabel: string;
   message: string;
   ctaLabel: string;
   bullets: string[];
   surveyId?: string;
};

export type EarlyAccessBannerProps = {
   template: EarlyAccessBannerTemplate;
};

export function EarlyAccessBanner({ template }: EarlyAccessBannerProps) {
   const { openSheet, closeSheet } = useSheet();

   const handleCtaClick = () => {
      openSheet({
         children: (
            <div className="space-y-4">
               <div>
                  <h3 className="text-lg font-semibold">Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                     {template.message}
                  </p>
               </div>
               <FeatureFeedbackForm
                  featureName={template.badgeLabel}
                  onSuccess={closeSheet}
               />
            </div>
         ),
      });
   };

   return (
      <div className="rounded-lg border bg-card p-4 flex gap-4">
         <div className="shrink-0 pt-0.5">
            <FlaskConical className="size-5 text-amber-500" />
         </div>
         <div className="space-y-3">
            <div className="flex items-center gap-2">
               <Badge
                  className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                  variant="outline"
               >
                  {template.badgeLabel}
               </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
               {template.message}{" "}
               <Button
                  className="h-auto p-0 text-foreground underline underline-offset-4 hover:text-primary"
                  onClick={handleCtaClick}
                  type="button"
                  variant="link"
               >
                  {template.ctaLabel}
               </Button>
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
               {template.bullets.map((bullet, index) => (
                  <li key={`early-access-bullet-${index + 1}`}>{bullet}</li>
               ))}
            </ul>
         </div>
      </div>
   );
}
