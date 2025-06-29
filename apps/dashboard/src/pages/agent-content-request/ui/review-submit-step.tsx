import type { ContentRequestForm } from "../lib/use-content-request-form";
import { FileTextIcon, TargetIcon, AlignLeftIcon } from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Button } from "@packages/ui/components/button";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";
import { useMemo } from "react";

export function ReviewSubmitStep({ form }: { form: ContentRequestForm }) {
   const infoItems = useMemo(
      () => [
         {
            icon: <FileTextIcon className="w-4 h-4" />,
            label: "Topic",
            value: String(form.getFieldValue("topic") ?? ""),
            className: "",
         },
         {
            icon: <TargetIcon className="w-4 h-4" />,
            label: "Target Length",
            value: formatValueToTitleCase(
               String(form.getFieldValue("targetLength") ?? ""),
            ),
            className: "",
         },
         {
            icon: <AlignLeftIcon className="w-4 h-4" />,
            label: "Brief Description",
            value: String(form.getFieldValue("briefDescription") ?? ""),
            className: "col-span-2",
         },
      ],
      [form],
   );

   return (
      <div className="grid grid-cols-2 gap-4 text-sm">
         {infoItems.map((item) => (
            <div className={item.className} key={item.label}>
               <InfoItem
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            </div>
         ))}
      </div>
   );
}

export function ReviewSubmitStepSubscribe({
   form,
}: {
   form: ContentRequestForm;
}) {
   return (
      <form.Subscribe
         selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
         })}
      >
         {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
               {isSubmitting ? "Requesting Content..." : "Request Content"}
            </Button>
         )}
      </form.Subscribe>
   );
}
