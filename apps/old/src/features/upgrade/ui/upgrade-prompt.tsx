import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { type Feature, useFeatureAccess } from "@/hooks/use-feature-access";

type UpgradePromptProps = {
   /** The feature that requires upgrade */
   feature: Feature;
   /** Optional custom title */
   title?: string;
   /** Optional custom description */
   description?: string;
   /** Variant for different display styles */
   variant?: "card" | "inline" | "banner";
   /** Optional additional content */
   children?: ReactNode;
};

/**
 * Component to display an upgrade prompt when a feature is locked.
 *
 * @example
 * ```tsx
 * if (!hasFeature(Feature.CHAT)) {
 *   return <UpgradePrompt feature={Feature.CHAT} />;
 * }
 * ```
 */
export const UpgradePrompt: FC<UpgradePromptProps> = ({
   feature,
   title,
   description,
   variant = "card",
   children,
}) => {
   const { activeOrganization } = useActiveOrganization();
   const { getFeatureDisplayName, getRequiredPlan, getPlanDisplayName } =
      useFeatureAccess();

   const featureName = getFeatureDisplayName(feature);
   const requiredPlan = getRequiredPlan(feature);
   const planName = getPlanDisplayName(requiredPlan);

   const defaultTitle = title ?? `Upgrade para usar ${featureName}`;
   const defaultDescription =
      description ??
      `Esta funcionalidade está disponível no plano ${planName}. Faça upgrade para desbloquear.`;

   if (variant === "inline") {
      return (
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-amber-500" />
            <span>{defaultTitle}</span>
            <Button asChild className="p-0 h-auto" size="sm" variant="link">
               <Link
                  params={{ slug: activeOrganization.slug }}
                  search={{ success: undefined }}
                  to="/$slug/plans"
               >
                  Ver planos
               </Link>
            </Button>
         </div>
      );
   }

   if (variant === "banner") {
      return (
         <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
               <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/50">
                  <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
               </div>
               <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                     {defaultTitle}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                     {defaultDescription}
                  </p>
               </div>
            </div>
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{ slug: activeOrganization.slug }}
                  search={{ success: undefined }}
                  to="/$slug/plans"
               >
                  Ver planos
               </Link>
            </Button>
         </div>
      );
   }

   // Default: card variant
   return (
      <Card className="border-dashed">
         <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-amber-100 p-3 dark:bg-amber-900/50">
               <Sparkles className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-lg">{defaultTitle}</CardTitle>
            <CardDescription>{defaultDescription}</CardDescription>
         </CardHeader>
         <CardContent className="text-center">
            {children}
            <Button asChild className="mt-4">
               <Link
                  params={{ slug: activeOrganization.slug }}
                  search={{ success: undefined }}
                  to="/$slug/plans"
               >
                  Ver planos disponíveis
               </Link>
            </Button>
         </CardContent>
      </Card>
   );
};
