import {
   ArrowDownToLine,
   ArrowUpFromLine,
   Bolt,
   BookOpen,
   Braces,
   StickyNote,
} from "lucide-react";
import type { SettingsNavSection } from "./settings-nav-items";

const basePath = "/$slug/$teamSlug/analytics/data-management";

export const dataManagementNavSections: SettingsNavSection[] = [
   {
      id: "pipeline",
      label: "Pipeline",
      defaultOpen: true,
      items: [
         {
            id: "dm-sources",
            title: "Fontes",
            href: `${basePath}/sources`,
            icon: ArrowDownToLine,
         },
         {
            id: "dm-destinations",
            title: "Destinos",
            href: `${basePath}/destinations`,
            icon: ArrowUpFromLine,
         },
      ],
   },
   {
      id: "schema",
      label: "Schema",
      defaultOpen: true,
      items: [
         {
            id: "dm-actions",
            title: "Ações",
            href: `${basePath}/actions`,
            icon: Bolt,
         },
         {
            id: "dm-event-definitions",
            title: "Definições de eventos",
            href: `${basePath}/event-definitions`,
            icon: BookOpen,
         },
         {
            id: "dm-property-definitions",
            title: "Definições de propriedades",
            href: `${basePath}/property-definitions`,
            icon: Braces,
         },
      ],
   },
   {
      id: "metadata",
      label: "Metadata",
      defaultOpen: true,
      items: [
         {
            id: "dm-annotations",
            title: "Anotações",
            href: `${basePath}/annotations`,
            icon: StickyNote,
         },
      ],
   },
];
