import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import { Link } from "@tanstack/react-router";
import { Activity, Loader2 } from "lucide-react";
import type { ContentSelect } from "@packages/database/schema";
export function ContentRequestCard({
   request,
}: {
   request: Pick<ContentSelect, "id" | "meta" | "imageUrl" | "status">;
}) {
   return (
      <Card>
         {request.status === "generating" ? (
            <div className="flex items-center justify-center h-full">
               <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 text-muted-foreground">
                     Generating your content...
                  </span>
               </div>
            </div>
         ) : (
            <>
               <CardHeader>
                  <CardTitle className="line-clamp-1">
                     {request.meta?.title}
                  </CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-1 gap-2 ">
                  <InfoItem
                     icon={<Activity className="h-4 w-4" />}
                     label="Status"
                     value={request.status ?? ""}
                  />
               </CardContent>
               <CardFooter>
                  <Button className="w-full" variant="outline" asChild>
                     <Link params={{ id: request.id }} to="/content/$id">
                        Manage your content
                     </Link>
                  </Button>
               </CardFooter>
            </>
         )}
      </Card>
   );
}
