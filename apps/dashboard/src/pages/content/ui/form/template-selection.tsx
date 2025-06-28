import type { FormApi } from "@/types";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import type { TemplateSelectionFormData } from ".";

const AGENT_TEMPLATES = [
   {
      id: "tech-blog",
      name: "Tech Blog Writer",
      description:
         "Creates technical articles, tutorials, and industry insights",
      tone: "professional",
      targetAudience: "Software developers and tech professionals",
      basePrompt:
         "You are an expert technical writer specializing in software development and technology trends. Write clear, informative articles that explain complex technical concepts in an accessible way. Always include practical examples, code snippets when relevant, and actionable insights that help developers improve their skills.",
      exampleTitle: "Understanding React Server Components: A Complete Guide",
   },
   {
      id: "marketing",
      name: "Marketing Content Creator",
      description:
         "Produces marketing copy, case studies, and promotional content",
      tone: "conversational",
      targetAudience: "Marketing professionals and business owners",
      basePrompt:
         "You are a skilled marketing content writer who creates engaging, persuasive content that drives results. Focus on benefits over features, use storytelling techniques, and always include clear calls-to-action. Write in a conversational tone that builds trust and authority.",
      exampleTitle:
         "How We Increased Lead Generation by 300% Using Content Marketing",
   },
   {
      id: "lifestyle",
      name: "Lifestyle Blogger",
      description:
         "Writes personal stories, lifestyle tips, and inspirational content",
      tone: "casual",
      targetAudience:
         "General audience interested in lifestyle and personal development",
      basePrompt:
         "You are a lifestyle blogger who writes authentic, relatable content about personal experiences, tips, and inspiration. Use a warm, conversational tone and share practical advice that readers can apply to their daily lives. Include personal anecdotes and make content feel genuine and approachable.",
      exampleTitle: "5 Morning Habits That Transformed My Productivity",
   },
];

interface TemplateSelectionProps {
   form: FormApi<TemplateSelectionFormData>;
}
export function TemplateSelection({ form }: TemplateSelectionProps) {
   const [selectedTemplate, setSelectedTemplate] = useState<string>("");

   const handleTemplateSelect = (templateId: string) => {
      setSelectedTemplate(templateId);
      const selectedTemplateData = AGENT_TEMPLATES.find(
         (t) => t.id === templateId,
      );

      if (selectedTemplateData) {
         // Update form values when template is selected
         form.setFieldValue("templateId", templateId);
         form.setFieldValue("name", selectedTemplateData.name);
      }
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center">
               <Sparkles className="h-5 w-5 mr-2 text-primary" />
               Choose a Starting Point
            </CardTitle>
            <CardDescription>
               Select a template to get started quickly, or create a custom
               agent from scratch.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {AGENT_TEMPLATES.map((template) => (
                  <div
                     key={template.id}
                     className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id
                           ? "border-primary bg-primary/10"
                           : "border-gray-200 hover:border-gray-300"
                     }`}
                     onClick={() => handleTemplateSelect(template.id)}
                  >
                     <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                           {template.name}
                        </h3>
                        {selectedTemplate === template.id && (
                           <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                     </div>
                     <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                     </p>
                     <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                           {template.tone}
                        </Badge>
                     </div>
                  </div>
               ))}
            </div>

            <div className="border-t pt-6">
               <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                     selectedTemplate === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                     setSelectedTemplate("custom");
                     form.setFieldValue("templateId", "custom");
                     form.setFieldValue("name", "");
                  }}
               >
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="font-semibold text-gray-900">
                           Start from Scratch
                        </h3>
                        <p className="text-sm text-gray-600">
                           Create a completely custom agent
                        </p>
                     </div>
                     {selectedTemplate === "custom" && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                     )}
                  </div>
               </div>
            </div>

            {selectedTemplate === "custom" && (
               <div className="mt-4">
                  <form.AppField name="name">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>Agent Name</field.FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(
                                 e: React.ChangeEvent<HTMLInputElement>,
                              ) => field.handleChange(e.target.value)}
                              placeholder="Enter your agent name"
                              type="text"
                              value={String(field.state.value)}
                           />
                           <field.FieldMessage />
                        </field.FieldContainer>
                     )}
                  </form.AppField>
               </div>
            )}
         </CardContent>
      </Card>
   );
}
