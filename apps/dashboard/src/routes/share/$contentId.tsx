import { createFileRoute } from "@tanstack/react-router";
import { SharedContentView } from "@/features/content/ui/shared-content-view";

export const Route = createFileRoute("/share/$contentId")({
   component: SharedContentPage,
});

function SharedContentPage() {
   const { contentId } = Route.useParams();
   return <SharedContentView contentId={contentId} />;
}
