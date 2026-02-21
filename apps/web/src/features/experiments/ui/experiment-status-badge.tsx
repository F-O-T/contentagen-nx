import { Badge } from "@packages/ui/components/badge";

type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

const STATUS_CONFIG: Record<
   ExperimentStatus,
   {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
   }
> = {
   draft: { label: "Rascunho", variant: "outline" },
   running: { label: "Em execução", variant: "default" },
   paused: { label: "Pausado", variant: "secondary" },
   concluded: { label: "Concluído", variant: "secondary" },
};

export function ExperimentStatusBadge({
   status,
}: {
   status: ExperimentStatus;
}) {
   const config = STATUS_CONFIG[status];
   return <Badge variant={config.variant}>{config.label}</Badge>;
}
