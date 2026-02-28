import { createFileRoute } from "@tanstack/react-router";
import { setChatMode } from "@/features/teco-chat/stores/chat-context-store";
import { FormBuilder } from "@/features/forms/ui/form-builder";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/forms/$formId",
)({
   loader: () => { setChatMode("forms"); },
   component: FormBuilderPage,
});

function FormBuilderPage() {
   const { formId } = Route.useParams();

   return <FormBuilder formId={formId} />;
}
