import { createFileRoute } from "@tanstack/react-router";
import { CompetitorListPage } from "@/pages/competitor-list/ui/competitor-list-page";
import { z } from "zod";

const competitorSearchSchema = z.object({
   search: z.string().optional(),
   page: z.coerce.number().int().min(1).default(1),
});

export const Route = createFileRoute("/_dashboard/competitors/")({
   component: CompetitorListPage,
   validateSearch: (search) => competitorSearchSchema.parse(search),
});
