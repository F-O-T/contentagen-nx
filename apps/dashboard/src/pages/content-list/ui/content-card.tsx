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
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { Activity, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Progress } from "@packages/ui/components/progress";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { Separator } from "@packages/ui/components/separator";

const getStatusDisplay = (status: string | null) => {
   if (!status)
      return { label: "Unknown", progress: 0, variant: "secondary" as const };

   const statusConfig = {
      pending: { label: "Pending", progress: 0, variant: "secondary" as const },
      planning: {
         label: "Planning",
         progress: 15,
         variant: "default" as const,
      },
      researching: {
         label: "Researching",
         progress: 35,
         variant: "default" as const,
      },
      writing: { label: "Writing", progress: 60, variant: "default" as const },
      editing: { label: "Editing", progress: 80, variant: "default" as const },
      analyzing: {
         label: "Analyzing",
         progress: 95,
         variant: "default" as const,
      },
      draft: { label: "Draft", progress: 100, variant: "default" as const },
      approved: {
         label: "Approved",
         progress: 100,
         variant: "destructive" as const,
      },
   };

   return (
      statusConfig[status as keyof typeof statusConfig] || {
         label: status,
         progress: 0,
         variant: "secondary" as const,
      }
   );
};

const isGeneratingStatus = (status: string | null) => {
   return (
      status &&
      [
         "pending",
         "planning",
         "researching",
         "writing",
         "editing",
         "analyzing",
      ].includes(status)
   );
};

export function ContentRequestCard({
   request,
}: {
   request: RouterOutput["content"]["listAllContent"]["items"][0];
}) {
   const statusInfo = getStatusDisplay(request.status);
   const isGenerating = isGeneratingStatus(request.status);

   return (
      <Card>
         {isGenerating ? (
            <>
               <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
               </CardHeader>
               <CardContent className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">
                           {request.status}
                        </span>
                        <span>{statusInfo.progress}%</span>
                     </div>
                     <Progress value={statusInfo.progress} className="w-full" />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                     <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                     <span>Generating content...</span>
                  </div>
               </CardContent>
               <CardFooter className="flex flex-col gap-2">
                  <Separator />
                  <Skeleton className="h-5 w-1/2 mb-2" />
                  <Skeleton className="h-16 w-full" />
               </CardFooter>
            </>
         ) : (
            <>
               <CardHeader>
                  <CardTitle className="line-clamp-1">
                     {request.meta?.title}
                  </CardTitle>
                  <CardAction>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                              <Link
                                 params={{ id: request.id }}
                                 to={`/content/$id`}
                              >
                                 View Content
                              </Link>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </CardAction>
                  <CardDescription className="line-clamp-1">
                     {request.meta?.description ?? "No description found"}
                  </CardDescription>
               </CardHeader>
               <CardContent className="grid grid-cols-1 gap-2">
                  <InfoItem
                     icon={<Activity className="h-4 w-4" />}
                     label="Status"
                     value={statusInfo.label}
                  />
               </CardContent>
               <CardFooter className="flex flex-col gap-2">
                  <Separator />
                  <span className="w-full text-sm text-muted-foreground text-start">
                     Written By:
                  </span>
                  <AgentWriterCard
                     name={request.agent.personaConfig.metadata.name}
                     description={
                        request.agent.personaConfig.metadata.description
                     }
                  />
               </CardFooter>
            </>
         )}
      </Card>
   );
}
