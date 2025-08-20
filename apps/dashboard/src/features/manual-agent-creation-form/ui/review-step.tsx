import { Button } from "@packages/ui/components/button";
import { InfoItem } from "@packages/ui/components/info-item";

import type { AgentForm } from "../lib/use-agent-form";
import {
   UserIcon,
   FileTextIcon,
   LayoutGridIcon,
   UsersIcon,
   PaintbrushIcon,
   Brain,
   SpeakerIcon,
   GlobeIcon,
} from "lucide-react";

// Helper function to format values consistently
const formatValue = (value: string): string => {
   if (!value) return "";
   // Handle language codes specially
   const languageMap: Record<string, string> = {
      en: "English",
      pt: "Portuguese",
      es: "Spanish",
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "pt-BR": "Portuguese (Brazil)",
      "pt-PT": "Portuguese (Portugal)",
      "es-ES": "Spanish (Spain)",
      "es-MX": "Spanish (Mexico)",
   };

   if (languageMap[value]) {
      return languageMap[value];
   }

   // For other values, format them properly
   return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export function ReviewStep({ form }: { form: AgentForm }) {
   // Collect all items with their values
   const singleColumnItems = [
      {
         icon: <UserIcon className="w-4 h-4" />,
         label: "Agent Name",
         value: String(form.getFieldValue("metadata.name") ?? ""),
      },
      {
         icon: <UsersIcon className="w-4 h-4" />,
         label: "Audience",
         value: formatValue(String(form.getFieldValue("audience.base") ?? "")),
      },
      {
         icon: <LayoutGridIcon className="w-4 h-4" />,
         label: "Purpose",
         value: formatValue(String(form.getFieldValue("purpose") ?? "")),
      },
      {
         icon: <Brain className="w-4 h-4" />,
         label: "Brand Integration",
         value: formatValue(
            String(form.getFieldValue("brand.integrationStyle") ?? ""),
         ),
      },
      {
         icon: <GlobeIcon className="w-4 h-4" />,
         label: "Language",
         value: formatValue(
            String(form.getFieldValue("language.primary") ?? ""),
         ),
      },
      {
         icon: <PaintbrushIcon className="w-4 h-4" />,
         label: "Formatting Style",
         value: formatValue(
            String(form.getFieldValue("formatting.style") ?? ""),
         ),
      },
   ];

   // Communication style as a double-width item
   const communicationStyle = {
      icon: <SpeakerIcon className="w-4 h-4" />,
      label: "Communication Style",
      value: formatValue(
         String(form.getFieldValue("voice.communication") ?? ""),
      ),
   };

   // Optional single-column items
   const optionalItems = [];

   const languageVariant = form.getFieldValue("language.variant");
   if (languageVariant) {
      optionalItems.push({
         icon: <GlobeIcon className="w-4 h-4" />,
         label: "Language Variant",
         value: formatValue(String(languageVariant)),
      });
   }

   const listStyle = form.getFieldValue("formatting.listStyle");
   if (listStyle) {
      optionalItems.push({
         icon: <PaintbrushIcon className="w-4 h-4" />,
         label: "List Style",
         value: formatValue(String(listStyle)),
      });
   }

   // Combine core and optional single-column items
   const allSingleItems = [...singleColumnItems, ...optionalItems];

   // Full-width items
   const fullWidthItems = [];

   const description = form.getFieldValue("metadata.description");
   if (description) {
      fullWidthItems.push({
         icon: <FileTextIcon className="w-4 h-4" />,
         label: "Description",
         value: String(description).replace(/<[^>]*>/g, ""),
      });
   }

   const blacklistWords = form.getFieldValue("brand.blacklistWords");
   if (blacklistWords) {
      fullWidthItems.push({
         icon: <Brain className="w-4 h-4" />,
         label: "Blacklist Words",
         value: String(blacklistWords).replace(/<[^>]*>/g, ""),
      });
   }

   return (
      <div className="space-y-4">
         {/* Grid for items */}
         <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Communication style spans 2 columns */}
            <div className="col-span-2">
               <InfoItem
                  icon={communicationStyle.icon}
                  label={communicationStyle.label}
                  value={communicationStyle.value}
               />
            </div>

            {/* Single-column items */}
            {allSingleItems.map((item) => (
               <InfoItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            ))}
         </div>

         {/* Full-width items */}
         {fullWidthItems.length > 0 && (
            <div className="space-y-4">
               {fullWidthItems.map((item) => (
                  <InfoItem
                     key={item.label}
                     icon={item.icon}
                     label={item.label}
                     value={item.value}
                  />
               ))}
            </div>
         )}
      </div>
   );
}

export function ReviewStepSubscribe({ form }: { form: AgentForm }) {
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
