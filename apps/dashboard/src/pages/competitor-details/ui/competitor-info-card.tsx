import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Calendar, Globe, User } from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
interface CompetitorInfoCardProps {
   name: string;
   websiteUrl: string;
   createdAt: Date;
   updatedAt: Date;
}

export function CompetitorInfoCard({
   name,
   websiteUrl,
   createdAt,
   updatedAt,
}: CompetitorInfoCardProps) {
   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
      }).format(date);
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Your competitor details</CardTitle>
            <CardDescription>
               All the details about your competitor
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-2">
            <InfoItem
               icon={<User className="h-4 w-4" />}
               label="Name"
               value={name}
            />
            <InfoItem
               icon={<Globe className="h-4 w-4" />}
               label="Website"
               value={websiteUrl}
            />
            <div className="grid grid-cols-2 gap-2">
               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Added on"
                  value={formatDate(new Date(createdAt))}
               />

               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Last updated"
                  value={formatDate(new Date(updatedAt))}
               />
            </div>
         </CardContent>
      </Card>
   );
}
