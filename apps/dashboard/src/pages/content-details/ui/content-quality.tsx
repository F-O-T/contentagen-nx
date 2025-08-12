import type { ContentSelect } from "@packages/database/schema";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardAction,
   CardContent,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaTrigger,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaBody,
   CredenzaFooter,
   CredenzaClose,
} from "@packages/ui/components/credenza";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";

function getQualityLabel(score: number | null | undefined): string {
   if (score == null) return "No score";
   if (score >= 90) return "Excellent";
   if (score >= 75) return "Good";
   if (score >= 55) return "Fair";
   if (score >= 30) return "Needs Improvement";
   return "Poor";
}

export function ContentQualityCard({ content }: { content: ContentSelect }) {
   const score = useMemo(() => {
      return Number(content.stats?.qualityScore);
   }, [content.stats?.qualityScore]);
   const [open, setOpen] = useState(false);

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Content quality</CardTitle>
            <CardDescription>The quality of your content</CardDescription>
            <CardAction>
               <Credenza open={open} onOpenChange={setOpen}>
                  <CredenzaTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        aria-label="How is this score calculated?"
                     >
                        <Info className="w-5 h-5" />
                     </Button>
                  </CredenzaTrigger>
                  <CredenzaContent className="max-w-lg">
                     <CredenzaHeader>
                        <CredenzaTitle>
                           How the Quality Score is Calculated
                        </CredenzaTitle>
                        <CredenzaDescription>
                           Your content quality score is determined based on
                           multiple factors such as clarity & coherence, grammar
                           & spelling, structure & organization, and engagement
                           & value. Each factor is weighted and scored
                           individually, then combined for the final score.
                        </CredenzaDescription>
                     </CredenzaHeader>
                     <CredenzaBody>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                           <li>
                              <strong>Clarity & Coherence</strong>: Logical
                              flow, structure, clear topic progression, coherent
                              arguments, easy to follow
                           </li>
                           <li>
                              <strong>Grammar & Spelling</strong>: Correct
                              spelling, grammar, punctuation, professional
                              language
                           </li>
                           <li>
                              <strong>Structure & Organization</strong>:
                              Headings, subheadings, paragraph structure,
                              logical hierarchy, formatting
                           </li>
                           <li>
                              <strong>Engagement & Value</strong>: Relevance,
                              actionable insights, compelling content, clear
                              value proposition
                           </li>
                        </ul>
                     </CredenzaBody>
                     <CredenzaFooter>
                        <CredenzaClose asChild>
                           <Button variant="secondary">Close</Button>
                        </CredenzaClose>
                     </CredenzaFooter>
                  </CredenzaContent>
               </Credenza>
            </CardAction>
         </CardHeader>
         <CardContent className="grid grid-cols-1 gap-4 items-center">
            <div className="flex flex-col items-center gap-2">
               <div className="flex items-center gap-2 text-lg font-semibold">
                  <span>Score:</span>
                  <span className="text-2xl font-bold">
                     {score != null ? Math.round(score) : "-"}
                  </span>
                  <Badge variant="secondary" className="text-xs py-1 px-2">
                     {getQualityLabel(score)}
                  </Badge>
               </div>
               <span className="text-xs text-muted-foreground">
                  Score out of 100
               </span>
            </div>
            <Progress value={typeof score === "number" ? score : 0} max={100} />
         </CardContent>
      </Card>
   );
}
