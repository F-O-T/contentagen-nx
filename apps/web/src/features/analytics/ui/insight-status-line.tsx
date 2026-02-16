import { Button } from "@packages/ui/components/button";

interface InsightStatusLineProps {
   lastComputedAt?: Date | null;
   onRefresh: () => void;
   isRefreshing?: boolean;
}

export function InsightStatusLine({
   lastComputedAt,
   onRefresh,
   isRefreshing = false,
}: InsightStatusLineProps) {
   const getTimeLabel = () => {
      if (!lastComputedAt) {
         return "nunca";
      }

      const now = new Date();
      const diffMs = now.getTime() - lastComputedAt.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
         return "agora";
      }

      if (diffMins < 60) {
         return `há ${diffMins}min`;
      }

      if (diffHours < 24) {
         return `há ${diffHours}h`;
      }

      return `há ${diffDays}d`;
   };

   return (
      <div className="text-xs text-muted-foreground py-1.5 flex items-center gap-2">
         <span>Computado {getTimeLabel()}</span>
         <Button
            className="h-auto p-0 text-xs text-primary hover:underline"
            disabled={isRefreshing}
            onClick={onRefresh}
            variant="link"
         >
            {isRefreshing ? "Atualizando..." : "Atualizar"}
         </Button>
      </div>
   );
}
