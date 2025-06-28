import type { AgentForm } from "../lib/use-agent-form";
import {
   UserIcon,
   FileTextIcon,
   LayoutGridIcon,
   MicIcon,
   UsersIcon,
   PaintbrushIcon,
} from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Button } from "@packages/ui/components/button";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";
import { useLocation, useMatchRoute, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";

export function ReviewSubmitStep({ form }: { form: AgentForm }) {
   const infoItems = [
      {
         icon: <UserIcon className="w-4 h-4" />,
         label: "Name",
         value: String(form.getFieldValue("name") ?? ""),
         className: "",
      },
      {
         icon: <LayoutGridIcon className="w-4 h-4" />,
         label: "Content Type",
         value: formatValueToTitleCase(
            String(form.getFieldValue("contentType") ?? ""),
         ),
         className: "",
      },
      {
         icon: <MicIcon className="w-4 h-4" />,
         label: "Voice Tone",
         value: String(form.getFieldValue("voiceTone") ?? ""),
         className: "",
      },
      {
         icon: <UsersIcon className="w-4 h-4" />,
         label: "Target Audience",
         value: formatValueToTitleCase(
            String(form.getFieldValue("targetAudience") ?? ""),
         ),
         className: "",
      },
      {
         icon: <PaintbrushIcon className="w-4 h-4" />,
         label: "Formatting Style",
         value: formatValueToTitleCase(
            String(form.getFieldValue("formattingStyle") ?? ""),
         ),
         className: "col-span-2",
      },
      {
         icon: <FileTextIcon className="w-4 h-4" />,
         label: "Description",
         value: String(form.getFieldValue("description") ?? ""),
         className: "col-span-2",
      },
   ];

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
export function ReviewSubmitStepSubscribe({ form }: { form: AgentForm }) {
   const pathname = useLocation({
      select: (location) => location.pathname,
   });
   const buttonTexts = useMemo(() => {
      const match = pathname.match(/^\/agents\/[^/]+\/edit$/);
      return match
         ? { idle: "Edit Agent", loading: "Editing..." }
         : { idle: "Create Agent", loading: "Creating..." };
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
