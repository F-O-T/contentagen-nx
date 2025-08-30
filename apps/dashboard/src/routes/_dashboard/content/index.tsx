import { createFileRoute } from "@tanstack/react-router";
import { ContentListPage } from "@/pages/content-list/ui/content-list-page";
import { z } from "zod";

const contentSearchSchema = z.object({
   agentId: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/content/")({
   component: ContentListPage,
   validateSearch: (search) => contentSearchSchema.parse(search),
});
