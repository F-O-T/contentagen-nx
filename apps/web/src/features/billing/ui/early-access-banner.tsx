import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { FlaskConical } from "lucide-react";
import { FeatureFeedbackForm } from "@/features/feedback/ui/feature-feedback-form";
import { useCredenza } from "@/hooks/use-credenza";

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
   const { openCredenza, closeCredenza } = useCredenza();

   const handleCtaClick = () => {
      openCredenza({
         children: (
            <FeatureFeedbackForm
               featureName={template.badgeLabel}
               onSuccess={closeCredenza}
            />
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
