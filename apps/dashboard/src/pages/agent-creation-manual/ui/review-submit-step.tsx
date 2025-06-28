import type { AgentForm } from "../lib/use-agent-form";
import {
   UserIcon,
   FileTextIcon,
   LayoutGridIcon,
   MicIcon,
   UsersIcon,
   PaintbrushIcon,
   TagIcon,
   SearchIcon,
} from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Button } from "@packages/ui/components/button";

function formatLabelValue(val: string) {
   return val
      .replace(/_/g, " ")
      .replace(
         /\w\S*/g,
         (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
      );
}

export function ReviewSubmitStep({ form }: { form: AgentForm }) {
   const infoItems = [
      {
         icon: <UserIcon className="w-4 h-4" />,
         label: "Name",
         value: String(form.getFieldValue("name") ?? ""),
      },
      {
         icon: <FileTextIcon className="w-4 h-4" />,
         label: "Description",
         value: String(form.getFieldValue("description") ?? ""),
      },
      {
         icon: <LayoutGridIcon className="w-4 h-4" />,
         label: "Content Type",
         value: formatLabelValue(
            String(form.getFieldValue("contentType") ?? ""),
         ),
      },
      {
         icon: <MicIcon className="w-4 h-4" />,
         label: "Voice Tone",
         value: String(form.getFieldValue("voiceTone") ?? ""),
      },
      {
         icon: <UsersIcon className="w-4 h-4" />,
         label: "Target Audience",
         value: formatLabelValue(
            String(form.getFieldValue("targetAudience") ?? ""),
         ),
      },
      {
         icon: <PaintbrushIcon className="w-4 h-4" />,
         label: "Formatting Style",
         value: formatLabelValue(
            String(form.getFieldValue("formattingStyle") ?? ""),
         ),
      },
      {
         icon: <TagIcon className="w-4 h-4" />,
         label: "Topics",
         value: Array.isArray(form.getFieldValue("topics"))
            ? form.getFieldValue("topics").join(", ")
            : String(form.getFieldValue("topics") ?? ""),
      },
      {
         icon: <SearchIcon className="w-4 h-4" />,
         label: "SEO Keywords",
         value: Array.isArray(form.getFieldValue("seoKeywords"))
            ? form.getFieldValue("seoKeywords").join(", ")
            : String(form.getFieldValue("seoKeywords") ?? ""),
      },
   ];

   return (
      <div className="grid grid-cols-2 gap-4 text-sm">
         {/* Name and Topics on the same row */}
         {infoItems[0] && (
            <InfoItem
               icon={infoItems[0].icon}
               label={infoItems[0].label}
               value={infoItems[0].value}
            />
         )}
         {infoItems[6] && (
            <InfoItem
               icon={infoItems[6].icon}
               label={infoItems[6].label}
               value={infoItems[6].value}
            />
         )}
         {/* Description spans 2 cols */}
         <div className="col-span-2">
            {infoItems[1] && (
               <InfoItem
                  icon={infoItems[1].icon}
                  label={infoItems[1].label}
                  value={infoItems[1].value}
               />
            )}
         </div>
         {/* Content Type */}
         {infoItems[2] && (
            <InfoItem
               icon={infoItems[2].icon}
               label={infoItems[2].label}
               value={infoItems[2].value}
            />
         )}
         {/* Voice Tone */}
         {infoItems[3] && (
            <InfoItem
               icon={infoItems[3].icon}
               label={infoItems[3].label}
               value={infoItems[3].value}
            />
         )}
         {/* Target Audience */}
         {infoItems[4] && (
            <InfoItem
               icon={infoItems[4].icon}
               label={infoItems[4].label}
               value={infoItems[4].value}
            />
         )}
         {/* Formatting Style */}
         {infoItems[5] && (
            <InfoItem
               icon={infoItems[5].icon}
               label={infoItems[5].label}
               value={infoItems[5].value}
            />
         )}
         {/* SEO Keywords spans 2 cols */}
         <div className="col-span-2">
            {infoItems[7] && (
               <InfoItem
                  icon={infoItems[7].icon}
                  label={infoItems[7].label}
                  value={infoItems[7].value}
               />
            )}
         </div>
      </div>
   );
}
export function ReviewSubmitStepSubscribe({ form }: { form: AgentForm }) {
   return (
      <form.Subscribe
         selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
         })}
      >
         {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
               {isSubmitting ? "Creating..." : "Create Agent"}
            </Button>
         )}
      </form.Subscribe>
   );
}
