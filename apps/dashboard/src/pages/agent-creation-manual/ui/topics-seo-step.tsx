import { Badge } from "@packages/ui/components/badge";

import { Input } from "@packages/ui/components/input";
import { X } from "lucide-react";
import { useState } from "react";
import type { AgentForm } from "../lib/use-agent-form";

export default function TopicsSeoStep({ form }: { form: AgentForm }) {
   const [currentTopic, setCurrentTopic] = useState("");
   const [currentKeyword, setCurrentKeyword] = useState("");

   const addTopic = (topics: string[]) => {
      if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
         form.setFieldValue("topics", [...topics, currentTopic.trim()]);
         setCurrentTopic("");
      }
   };

   const removeTopic = (topicToRemove: string, topics: string[]) => {
      form.setFieldValue(
         "topics",
         topics.filter((topic: string) => topic !== topicToRemove),
      );
   };

   const addKeyword = (keywords: string[]) => {
      if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
         form.setFieldValue("seoKeywords", [
            ...keywords,
            currentKeyword.trim(),
         ]);
         setCurrentKeyword("");
      }
   };

   const removeKeyword = (keywordToRemove: string, keywords: string[]) => {
      form.setFieldValue(
         "seoKeywords",
         keywords.filter((keyword: string) => keyword !== keywordToRemove),
      );
   };

   return (
      <>
         <form.AppField name="topics">
            {(field) => (
               <field.FieldContainer className="space-y-4">
                  <field.FieldLabel className="text-sm font-medium text-foreground">
                     Preferred Topics
                  </field.FieldLabel>

                  <Input
                     className="flex-1"
                     onChange={(e) => setCurrentTopic(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === "Enter") {
                           e.preventDefault();
                           addTopic(field.state.value);
                        }
                        if (
                           e.key === " " &&
                           currentTopic.trim() &&
                           !field.state.value.includes(currentTopic.trim())
                        ) {
                           e.preventDefault();
                           addTopic(field.state.value);
                        }
                     }}
                     placeholder="Add a topic..."
                     value={currentTopic}
                  />

                  {field.state.value.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                        {field.state.value.map((topic: string) => (
                           <Badge
                              className="flex items-center gap-1.5 bg-secondary/50 text-secondary-foreground hover:bg-secondary/70"
                              key={topic}
                              variant="secondary"
                           >
                              {topic}
                              <button
                                 className="ml-0.5 rounded-sm hover:text-destructive"
                                 onClick={() =>
                                    removeTopic(topic, field.state.value)
                                 }
                                 type="button"
                              >
                                 <X className="h-3 w-3" />
                              </button>
                           </Badge>
                        ))}
                     </div>
                  )}
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
         <form.AppField name="seoKeywords">
            {(field) => (
               <field.FieldContainer className="space-y-4">
                  <field.FieldLabel className="text-sm font-medium text-foreground">
                     SEO Keywords
                  </field.FieldLabel>

                  <Input
                     className="flex-1"
                     onChange={(e) => setCurrentKeyword(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === "Enter") {
                           e.preventDefault();
                           addKeyword(field.state.value);
                        }
                        if (
                           e.key === " " &&
                           currentKeyword.trim() &&
                           !field.state.value.includes(currentKeyword.trim())
                        ) {
                           e.preventDefault();
                           addKeyword(field.state.value);
                        }
                     }}
                     placeholder="Add a keyword..."
                     value={currentKeyword}
                  />

                  {field.state.value.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                        {field.state.value.map((keyword: string) => (
                           <Badge
                              className="flex items-center gap-1.5 border-border bg-background text-foreground hover:bg-accent/50"
                              key={keyword}
                              variant="outline"
                           >
                              {keyword}
                              <button
                                 className="ml-0.5 rounded-sm hover:text-destructive"
                                 onClick={() =>
                                    removeKeyword(keyword, field.state.value)
                                 }
                                 type="button"
                              >
                                 <X className="h-3 w-3" />
                              </button>
                           </Badge>
                        ))}
                     </div>
                  )}
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </form.AppField>
      </>
   );
}
