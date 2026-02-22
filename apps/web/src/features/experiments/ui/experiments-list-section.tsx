import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, FlaskConical, Plus } from "lucide-react";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import { CreateExperimentSheet } from "./create-experiment-sheet";
import { ExperimentStatusBadge } from "./experiment-status-badge";

type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

type ExperimentRow = {
   id: string;
   name: string;
   targetType: string;
   goal: string;
   status: ExperimentStatus;
   createdAt: Date;
};

const TARGET_TYPE_LABELS: Record<string, string> = {
   content: "Conteúdo",
   form: "Formulário",
   cluster: "Cluster",
};

const GOAL_LABELS: Record<string, string> = {
   conversion: "Conversão",
   ctr: "CTR",
   time_on_page: "Tempo na página",
   form_submit: "Envio de formulário",
};

function useExperimentColumns(
   slug: string,
   teamSlug: string,
): ColumnDef<ExperimentRow>[] {
   return [
      {
         accessorKey: "name",
         header: "Nome",
      },
      {
         accessorKey: "targetType",
         header: "Alvo",
         cell: ({ row }) =>
            TARGET_TYPE_LABELS[row.original.targetType] ??
            row.original.targetType,
      },
      {
         accessorKey: "goal",
         header: "Métrica",
         cell: ({ row }) => GOAL_LABELS[row.original.goal] ?? row.original.goal,
      },
      {
         accessorKey: "status",
         header: "Status",
         cell: ({ row }) => (
            <ExperimentStatusBadge status={row.original.status} />
         ),
      },
      {
         accessorKey: "createdAt",
         header: "Criado em",
         cell: ({ row }) =>
            new Date(row.original.createdAt).toLocaleDateString("pt-BR"),
      },
      {
         id: "actions",
         header: "",
         cell: ({ row }) => (
            <div className="flex justify-end">
               <Button asChild size="sm" variant="ghost">
                  <Link
                     params={{ slug, teamSlug, experimentId: row.original.id }}
                     to="/$slug/$teamSlug/experiments/$experimentId"
                  >
                     Ver detalhes
                     <ArrowRight className="ml-2 size-4" />
                  </Link>
               </Button>
            </div>
         ),
      },
   ];
}

export function ExperimentsListSection() {
   const { openSheet, closeSheet } = useSheet();
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };
   const { data: experiments } = useSuspenseQuery(
      orpc.experiments.list.queryOptions({}),
   );

   const columns = useExperimentColumns(slug, teamSlug);

   const handleOpenCreateSheet = () => {
      openSheet({
         children: <CreateExperimentSheet onSuccess={closeSheet} />,
      });
   };

   if (!experiments.length) {
      return (
         <Empty>
            <EmptyMedia>
               <FlaskConical className="size-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyContent>
               <EmptyTitle>Nenhum experimento ainda</EmptyTitle>
               <EmptyDescription>
                  Crie seu primeiro experimento A/B para comparar variantes de
                  conteúdo ou formulários.
               </EmptyDescription>
               <Button onClick={handleOpenCreateSheet}>
                  <Plus className="mr-2 size-4" />
                  Criar experimento
               </Button>
            </EmptyContent>
         </Empty>
      );
   }

   return (
      <div className="flex flex-col gap-4">
         <div className="flex items-center justify-end">
            <Button onClick={handleOpenCreateSheet} size="sm">
               <Plus className="mr-2 size-4" />
               Novo experimento
            </Button>
         </div>
         <DataTable columns={columns} data={experiments} />
      </div>
   );
}
