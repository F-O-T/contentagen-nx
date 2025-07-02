import type { ContentRequestForm } from "../lib/use-content-request-form";
import { FileTextIcon, TargetIcon, AlignLeftIcon, HashIcon, LinkIcon, CheckIcon, XIcon } from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Button } from "@packages/ui/components/button";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";
import { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";

export function ReviewSubmitStep({ form }: { form: ContentRequestForm }) {
   const basicInfoItems = useMemo(
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

   const featureItems = useMemo(
      () => [
         {
            icon: <HashIcon className="w-4 h-4" />,
            label: "Include Meta Tags",
            value: form.getFieldValue("includeMetaTags") ? "Enabled" : "Disabled",
            enabled: form.getFieldValue("includeMetaTags"),
         },
         {
            icon: <FileTextIcon className="w-4 h-4" />,
            label: "Include Meta Description",
            value: form.getFieldValue("includeMetaDescription") ? "Enabled" : "Disabled",
            enabled: form.getFieldValue("includeMetaDescription"),
         },
         {
            icon: <LinkIcon className="w-4 h-4" />,
            label: "Internal Link Format",
            value: formatValueToTitleCase(String(form.getFieldValue("internalLinkFormat") ?? "")),
            enabled: true,
         },
      ],
      [form],
   );

   return (
      <div className="space-y-6">
         <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
               {basicInfoItems.map((item) => (
                  <div className={item.className} key={item.label}>
                     <InfoItem
                        icon={item.icon}
                        label={item.label}
                        value={item.value}
                     />
                  </div>
               ))}
            </div>
         </div>

         <div>
            <h3 className="text-lg font-semibold mb-4">Content Features</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
               {featureItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 border rounded-lg">
                     {item.icon}
                     <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-muted-foreground">{item.value}</div>
                     </div>
                     {item.label !== "Internal Link Format" && (
                        <div className={`w-5 h-5 ${item.enabled ? "text-green-500" : "text-gray-400"}`}>
                           {item.enabled ? <CheckIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
                        </div>
                     )}
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}

export function ReviewSubmitStepSubscribe({
   form,
}: {
   form: ContentRequestForm;
}) {
   const pathname = useLocation({
      select: (location) => location.pathname,
   });
   const buttonTexts = useMemo(() => {
      const match = pathname.match(/^\/content\/requests\/[^/]+\/edit$/);
      return match
         ? { idle: "Edit Request", loading: "Editing..." }
         : { idle: "Create Request", loading: "Creating..." };
   }, [pathname]);
   return (
      <form.Subscribe
         selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
         })}
      >
         {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
               {isSubmitting ? buttonTexts.loading : buttonTexts.idle}
            </Button>
         )}
      </form.Subscribe>
   );
}
