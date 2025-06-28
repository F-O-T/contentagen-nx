import type { FormApi } from "@/types";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Textarea } from "@packages/ui/components/textarea";
import { FileText, Lightbulb } from "lucide-react";
import type { ArticleExampleFormData } from ".";

interface ArticleExampleFormProps {
   form: FormApi<ArticleExampleFormData>;
}

export function ArticleExample({ form }: ArticleExampleFormProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center">
               <FileText className="h-5 w-5 mr-2 text-primary" />
               Example Article
            </CardTitle>
            <CardDescription>
               Provide an example article that represents your desired style and
               quality.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div>
                  <form.AppField name="exampleArticle">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>
                              Paste your example article
                           </field.FieldLabel>
                           <Textarea
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(
                                 e: React.ChangeEvent<HTMLTextAreaElement>,
                              ) => field.handleChange(e.target.value)}
                              placeholder="Paste a complete article that demonstrates the style, structure, and quality you want..."
                              value={String(field.state.value)}
                           />
                           <field.FieldMessage />
                        </field.FieldContainer>
                     )}
                  </form.AppField>
               </div>

               <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                     <div className="flex items-start space-x-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                        <div className="text-sm text-primary">
                           <p className="font-medium mb-2">
                              What makes a good example?
                           </p>
                           <ul className="list-disc list-inside space-y-1 text-primary">
                              <li>Complete article (not just a snippet)</li>
                              <li>Represents your desired quality level</li>
                              <li>Shows preferred structure and formatting</li>
                              <li>Demonstrates the tone you want</li>
                              <li>
                                 Includes typical elements (headings, lists,
                                 etc.)
                              </li>
                           </ul>
                        </div>
                     </div>
                  </div>

                  {form.state.values.exampleArticle && (
                     <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">
                           Article Analysis
                        </h4>
                        <div className="text-sm text-green-700 space-y-1">
                           <p>
                              Word count: ~
                              {
                                 form.state.values.exampleArticle.split(" ")
                                    .length
                              }{" "}
                              words
                           </p>
                           <p>
                              Paragraphs:{" "}
                              {
                                 form.state.values.exampleArticle.split("\n\n")
                                    .length
                              }
                           </p>
                           <p>
                              Headings:{" "}
                              {
                                 (
                                    form.state.values.exampleArticle.match(
                                       /^#/gm,
                                    ) || []
                                 ).length
                              }
                           </p>
                        </div>
                     </div>
                  )}

                  <div className="p-4 bg-primary/10 rounded-lg">
                     <h4 className="font-medium text-primary mb-2">
                        Need inspiration?
                     </h4>
                     <p className="text-sm text-primary mb-2">
                        Look for articles from:
                     </p>
                     <ul className="list-disc list-inside text-sm text-primary space-y-1">
                        <li>Your favorite industry blogs</li>
                        <li>Competitors' content</li>
                        <li>High-performing articles in your niche</li>
                        <li>Content that matches your brand voice</li>
                     </ul>
                  </div>
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
