import type { ContentRequestForm } from "../lib/use-content-request-form";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { Switch } from "@packages/ui/components/switch";
import { LinkIcon, HashIcon, FileTextIcon } from "lucide-react";

const FEATURE_TOGGLES = [
   {
      name: "includeMetaTags" as const,
      label: "Include Meta Tags",
      description: "Add SEO meta tags to the content",
      icon: <HashIcon className="w-4 h-4" />,
   },
   {
      name: "includeMetaDescription" as const,
      label: "Include Meta Description",
      description: "Generate a meta description for SEO",
      icon: <FileTextIcon className="w-4 h-4" />,
   },
] as const;

const INTERNAL_LINK_FORMATS = [
   {
      value: "mdx" as const,
      label: "MDX",
      description: "Use MDX format for internal links",
   },
   {
      value: "html" as const,
      label: "HTML",
      description: "Use HTML format for internal links",
   },
] as const;

export function FeatureTogglesStep({ form }: { form: ContentRequestForm }) {
   return (
      <div className="space-y-6">
         <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
               <LinkIcon className="w-5 h-5" />
               Content Features
            </h3>

            <div className="space-y-4">
               {FEATURE_TOGGLES.map((toggle) => (
                  <form.AppField key={toggle.name} name={toggle.name}>
                     {(field) => (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <div className="flex items-start gap-3">
                              {toggle.icon}
                              <div>
                                 <Label
                                    htmlFor={toggle.name}
                                    className="font-medium"
                                 >
                                    {toggle.label}
                                 </Label>
                                 <p className="text-sm text-muted-foreground mt-1">
                                    {toggle.description}
                                 </p>
                              </div>
                           </div>
                           <Switch
                              id={toggle.name}
                              checked={field.state.value}
                              onCheckedChange={field.handleChange}
                           />
                        </div>
                     )}
                  </form.AppField>
               ))}
            </div>
         </div>

         <div>
            <h4 className="text-md font-semibold mb-3">Internal Link Format</h4>
            <form.AppField name="internalLinkFormat">
               {(field) => (
                  <div className="grid grid-cols-2 gap-4">
                     {INTERNAL_LINK_FORMATS.map((format) => (
                        <button
                           key={format.value}
                           type="button"
                           className={`flex cursor-pointer flex-col items-center justify-between rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground transition-colors ${
                              field.state.value === format.value
                                 ? "border-primary bg-primary/5 text-primary"
                                 : "border-muted text-muted-foreground"
                           }`}
                           onClick={() => field.handleChange(format.value)}
                        >
                           <span className="font-semibold">{format.label}</span>
                           <span className="text-xs text-muted-foreground text-center">
                              {format.description}
                           </span>
                        </button>
                     ))}
                  </div>
               )}
            </form.AppField>
         </div>
      </div>
   );
}

export function FeatureTogglesStepSubscribe({
   form,
   next,
}: {
   form: ContentRequestForm;
   next: () => void;
}) {
   return (
      <form.Subscribe>
         {() => (
            <Button type="button" onClick={next}>
               Next
            </Button>
         )}
      </form.Subscribe>
   );
}
