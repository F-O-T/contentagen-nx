import { cn } from "@packages/ui/lib/utils";
import { FlaskConical, Lightbulb, Sparkles } from "lucide-react";
import type * as React from "react";
import { Badge } from "./badge";

const STAGE_CONFIG = {
   alpha: {
      icon: Sparkles,
      label: "Alpha",
      className:
         "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/50 dark:bg-orange-950/30 dark:text-orange-400",
   },
   beta: {
      icon: FlaskConical,
      label: "Beta",
      className:
         "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400",
   },
   concept: {
      icon: Lightbulb,
      label: "Conceito",
      className:
         "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/30 dark:text-purple-400",
   },
   experimental: {
      icon: FlaskConical,
      label: "Experimental",
      className:
         "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400",
   },
   preview: {
      icon: FlaskConical,
      label: "Preview",
      className:
         "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-950/30 dark:text-cyan-400",
   },
} as const;

export type FeatureStage = keyof typeof STAGE_CONFIG;

export type FeatureStageBadgeProps = Omit<
   React.ComponentProps<typeof Badge>,
   "children" | "variant"
> & {
   stage: FeatureStage;
   showIcon?: boolean;
};

function FeatureStageBadge({
   stage,
   showIcon = true,
   className,
   ...props
}: FeatureStageBadgeProps) {
   const config = STAGE_CONFIG[stage];
   const Icon = config.icon;

   return (
      <Badge className={cn(config.className, className)} {...props}>
         {showIcon && <Icon />}
         {config.label}
      </Badge>
   );
}

export { FeatureStageBadge, STAGE_CONFIG };
