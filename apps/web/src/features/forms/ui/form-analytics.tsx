import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Hash, Percent, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";

// =============================================================================
// Types
// =============================================================================

interface FormAnalyticsProps {
   formId: string;
}

interface FormField {
   id: string;
   type: string;
   label: string;
}

interface Submission {
   id: string;
   data: Record<string, unknown>;
   submittedAt: Date | string;
}

interface FieldStat {
   fieldId: string;
   fieldName: string;
   completionRate: number;
   completed: number;
   total: number;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function AnalyticsSkeleton() {
   return (
      <div className="space-y-6">
         {/* Metric cards skeleton */}
         <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
               <Card key={`metric-skeleton-${i + 1}`}>
                  <CardHeader className="pb-2">
                     <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                     <Skeleton className="h-8 w-16" />
                  </CardContent>
               </Card>
            ))}
         </div>

         {/* Field completion skeleton */}
         <Card>
            <CardHeader>
               <Skeleton className="h-5 w-48" />
               <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
               {Array.from({ length: 4 }).map((_, i) => (
                  <div className="space-y-2" key={`field-skeleton-${i + 1}`}>
                     <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                     </div>
                     <Skeleton className="h-2 w-full rounded-full" />
                  </div>
               ))}
            </CardContent>
         </Card>
      </div>
   );
}

// =============================================================================
// Empty State
// =============================================================================

function AnalyticsEmptyState() {
   return (
      <Card>
         <CardContent className="py-12">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <BarChart3 className="size-12" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma submissão para analisar</EmptyTitle>
                  <EmptyDescription>
                     Este formulário ainda não recebeu submissões suficientes
                     para gerar análises.
                  </EmptyDescription>
               </EmptyContent>
            </Empty>
         </CardContent>
      </Card>
   );
}

// =============================================================================
// Metric Card
// =============================================================================

function MetricCard({
   title,
   value,
   icon,
}: {
   title: string;
   value: string;
   icon: React.ReactNode;
}) {
   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
               {title}
            </CardTitle>
            <div className="text-muted-foreground">{icon}</div>
         </CardHeader>
         <CardContent>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
               {value}
            </p>
         </CardContent>
      </Card>
   );
}

// =============================================================================
// Field Completion Bar
// =============================================================================

function FieldCompletionBar({ stat }: { stat: FieldStat }) {
   return (
      <div className="space-y-1.5">
         <div className="flex items-center justify-between text-sm">
            <span className="font-medium truncate mr-4">{stat.fieldName}</span>
            <span className="text-muted-foreground tabular-nums shrink-0">
               {stat.completionRate.toFixed(1)}% ({stat.completed}/{stat.total})
            </span>
         </div>
         <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
               className="h-full rounded-full bg-primary transition-all duration-300"
               style={{ width: `${Math.min(stat.completionRate, 100)}%` }}
            />
         </div>
      </div>
   );
}

// =============================================================================
// Main Component
// =============================================================================

export function FormAnalytics({ formId }: FormAnalyticsProps) {
   // Fetch form details for field definitions
   const { data: form, isLoading: isFormLoading } = useQuery({
      ...orpc.forms.getById.queryOptions({ input: { id: formId } }),
   });

   // Fetch all submissions (up to 100 for analytics)
   const { data: submissionsData, isLoading: isSubmissionsLoading } = useQuery({
      ...orpc.forms.getSubmissions.queryOptions({
         input: { formId, page: 1, limit: 100 },
      }),
   });

   const isLoading = isFormLoading || isSubmissionsLoading;

   // Calculate analytics
   const analytics = useMemo(() => {
      if (!form || !submissionsData) return null;

      const fields = (form.fields as FormField[]) ?? [];
      const submissions = (submissionsData.submissions as Submission[]) ?? [];
      const totalSubmissions = submissionsData.total ?? 0;
      const sampleSize = submissions.length;

      if (totalSubmissions === 0) return null;

      // Average per day — calculate from earliest to latest submission
      let avgPerDay = "0";
      if (submissions.length > 0) {
         const dates = submissions.map((s) =>
            new Date(s.submittedAt).getTime(),
         );
         const earliest = Math.min(...dates);
         const latest = Math.max(...dates);
         const daysDiff = Math.max(
            1,
            Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24)),
         );
         avgPerDay = (totalSubmissions / daysDiff).toFixed(1);
      }

      // Field completion rates (based on fetched sample, not server total)
      const fieldStats: FieldStat[] = fields.map((field) => {
         const completed = submissions.filter((s) => {
            const value = s.data[field.id];
            return value !== null && value !== undefined && value !== "";
         }).length;
         return {
            fieldId: field.id,
            fieldName: field.label,
            completionRate: sampleSize > 0 ? (completed / sampleSize) * 100 : 0,
            completed,
            total: sampleSize,
         };
      });

      // Overall completion rate
      const overallRate =
         fieldStats.length > 0
            ? fieldStats.reduce((sum, f) => sum + f.completionRate, 0) /
              fieldStats.length
            : 0;

      return {
         totalSubmissions,
         avgPerDay,
         overallRate,
         fieldStats,
      };
   }, [form, submissionsData]);

   if (isLoading) {
      return <AnalyticsSkeleton />;
   }

   if (!analytics) {
      return <AnalyticsEmptyState />;
   }

   return (
      <div className="space-y-6">
         {/* Key metrics */}
         <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
               icon={<Hash className="size-4" />}
               title="Total de submissões"
               value={analytics.totalSubmissions.toLocaleString("pt-BR")}
            />
            <MetricCard
               icon={<TrendingUp className="size-4" />}
               title="Média por dia"
               value={analytics.avgPerDay}
            />
            <MetricCard
               icon={<Percent className="size-4" />}
               title="Taxa de preenchimento"
               value={`${analytics.overallRate.toFixed(1)}%`}
            />
         </div>

         {/* Field completion rates */}
         {analytics.fieldStats.length > 0 && (
            <Card>
               <CardHeader>
                  <CardTitle className="text-base">
                     Preenchimento por campo
                  </CardTitle>
                  <CardDescription>
                     Porcentagem de submissões com cada campo preenchido
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  {analytics.fieldStats.map((stat) => (
                     <FieldCompletionBar key={stat.fieldId} stat={stat} />
                  ))}
               </CardContent>
            </Card>
         )}
      </div>
   );
}
