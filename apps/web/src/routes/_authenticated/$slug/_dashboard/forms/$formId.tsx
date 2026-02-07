import { createFileRoute } from "@tanstack/react-router";
import { FormBuilder } from "@/features/forms/ui/form-builder";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/forms/$formId",
)({
   component: FormBuilderPage,
});

function FormBuilderPage() {
   const { formId } = Route.useParams();

   return <FormBuilder formId={formId} />;
}
