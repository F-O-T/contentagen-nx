import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";


import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";
import {
   Calendar,
   Target,
   Clock,
   BookOpen,


   FileText,
   MessageSquare,
} from "lucide-react";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";

interface RequestDetailsCardProps {
   request: {
      id: string;
      topic: string;
      briefDescription: string;
      createdAt: Date;
      targetLength: string;
      status: string;
      agentId?: string;
   };
}

interface ContentStatsCardProps {
   generatedContent?: {
      wordsCount?: number;
      readTimeMinutes?: number;
      tags?: string[];
   } | null;
}

export function RequestDetailsCard({ request }: RequestDetailsCardProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Request Details</CardTitle>
            <CardDescription>
               Information about your content request
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <InfoItem
               icon={<FileText className="h-4 w-4" />}
               label="Topic"
               value={request.topic}
            />
            <InfoItem
               icon={<MessageSquare className="h-4 w-4" />}
               label="Description"
               value={request.briefDescription}
            />


            <Separator />
            <div className="grid grid-cols-2 gap-4">
               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Created At"
                  value={new Date(request.createdAt).toLocaleDateString()}
               />
               <InfoItem
                  icon={<Target className="h-4 w-4" />}
                  label="Target Length"
                  value={formatValueToTitleCase(request.targetLength)}
               />
            </div>

         </CardContent>
      </Card>
   );
}

export function ContentStatsCard({ generatedContent }: ContentStatsCardProps) {
   if (!generatedContent) {
      return null;
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Content Stats</CardTitle>
            <CardDescription>
               Statistics and metadata about your generated content
            </CardDescription>
         </CardHeader>

         <CardContent className="grid grid-cols-2 gap-4">
            <InfoItem
               icon={<BookOpen className="h-4 w-4" />}
               label="Word Count"
               value={generatedContent.wordsCount?.toString() || "0"}
            />
            <InfoItem
               icon={<Clock className="h-4 w-4" />}
               label="Read Time"
               value={`${generatedContent.readTimeMinutes || 0} min`}
            />

         </CardContent>
      </Card>
   );
}
