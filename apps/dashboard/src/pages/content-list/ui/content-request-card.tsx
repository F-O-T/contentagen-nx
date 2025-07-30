import React from "react";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Link, useRouteContext } from "@tanstack/react-router";
import { MoreVertical, Edit, Trash, Activity } from "lucide-react";
import type { ContentSelect } from "@packages/database/schema";
export function ContentRequestCard({ request }: { request: ContentSelect }) {
   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1">{request.title}</CardTitle>
            <CardDescription className="line-clamp-1">
               {request.stats?.qualityScore}
            </CardDescription>
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
               <Link
                  params={{ requestId: request.id }}
                  to="/content/requests/$requestId"
               >
                  Manage your content
               </Link>
            </Button>
         </CardFooter>
      </Card>
   );
}
