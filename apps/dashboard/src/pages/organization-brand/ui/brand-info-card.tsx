import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Calendar, Globe } from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import type { RouterOutput } from "@packages/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
interface BrandInfoCardProps {
   brand: RouterOutput["brand"]["list"]["items"][number];
}

export function BrandInfoCard({ brand }: BrandInfoCardProps) {
   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
      }).format(date);
   };
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.brandFile.getLogo.queryOptions({
         brandId: brand.id,
      }),
   );
   return (
      <Card>
         <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>
               Basic information about your brand.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-2">
            <AgentWriterCard
               name={brand.name || ""}
               description={brand.summary || ""}
               photo={data?.data || ""}
            />
            <div className="grid grid-cols-1 gap-2">
               {brand.websiteUrl && (
                  <InfoItem
                     icon={<Globe className="h-4 w-4" />}
                     label="Website"
                     value={brand.websiteUrl}
                  />
               )}
               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Created"
                  value={formatDate(new Date(brand.createdAt))}
               />

               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Last Updated"
                  value={formatDate(new Date(brand.updatedAt))}
               />
            </div>
         </CardContent>
      </Card>
   );
}
