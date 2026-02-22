import { cn } from "@packages/ui/lib/utils";
import { CheckCircle2, FlaskConical, Lightbulb, Sparkles } from "lucide-react";
import type * as React from "react";
import { Badge } from "./badge";

const STAGE_CONFIG = {
   alpha: {
      icon: Sparkles,
      label: "Alpha",
      className:
         "border-chart-1 bg-chart-1/10 text-chart-1 dark:border-chart-1/50 dark:bg-chart-1/20 dark:text-chart-1",
   },
   beta: {
      icon: FlaskConical,
      label: "Beta",
      className:
         "border-chart-2 bg-chart-2/10 text-chart-2 dark:border-chart-2/50 dark:bg-chart-2/20 dark:text-chart-2",
   },
   concept: {
      icon: Lightbulb,
      label: "Conceito",
      className:
         "border-chart-4 bg-chart-4/10 text-chart-4 dark:border-chart-4/50 dark:bg-chart-4/20 dark:text-chart-4",
   },
   "general-availability": {
      icon: CheckCircle2,
      label: "Disponível",
      className:
         "border-chart-6 bg-chart-6/10 text-chart-6 dark:border-chart-6/50 dark:bg-chart-6/20 dark:text-chart-6",
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

export type FeatureStageChipProps = {
   stage: FeatureStage;
   count?: number;
   isActive?: boolean;
   onClick?: () => void;
   className?: string;
};

/**
 * FeatureStageChip - Um chip clicável para usar como filtro de estágio
 * - Mostra a badge com o nome do estágio
 * - Opcionalmente mostra uma contagem
 * - Suporta estado ativo/inativo
 * - Pode ser clicável para alternar filtros
 */
function FeatureStageChip({
   stage,
   count,
   isActive = true,
   onClick,
   className,
}: FeatureStageChipProps) {
   const config = STAGE_CONFIG[stage];
   const Icon = config.icon;

   const content = (
      <>
         <Icon className="size-3.5" />
         <span>{config.label}</span>
         {count !== undefined && (
            <span className="ml-1 text-muted-foreground">({count})</span>
         )}
      </>
   );

   if (onClick) {
      return (
         <button
            className={cn(
               "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
               "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
               isActive
                  ? config.className
                  : "border-muted bg-muted/50 text-muted-foreground opacity-50",
               "hover:opacity-80",
               className,
            )}
            onClick={onClick}
            type="button"
         >
            {content}
         </button>
      );
   }

   return (
      <span
         className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
            isActive ? config.className : "opacity-50",
            className,
         )}
      >
         {content}
      </span>
   );
}

export { FeatureStageBadge, FeatureStageChip, STAGE_CONFIG };
