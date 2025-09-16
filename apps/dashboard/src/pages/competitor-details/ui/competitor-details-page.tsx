import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CompetitorDetailsActions } from "./competitor-details-actions";
import { CompetitorStatsCard } from "./competitor-stats-card";
import { CompetitorFeaturesCard } from "./competitor-features-card";
import { CompetitorInfoCard } from "./competitor-info-card";
import { CreateEditCompetitorDialog } from "../../competitor-list/features/create-edit-competitor-dialog";
import { useState, useMemo } from "react";
import { CompetitorLoadingDisplay } from "./competitor-loading-display";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import {
   Building2,
   FileText,
   Download,
   Image as ImageIcon,
   Globe,
   CheckCircle,
   Clock,
   AlertTriangle,
   ExternalLink,
} from "lucide-react";
import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import { Separator } from "@packages/ui/components/separator";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";

function getStatusIcon(status: string | null) {
   switch (status) {
      case "completed":
         return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
      case "analyzing":
      case "chunking":
         return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
         return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
         return <Clock className="h-4 w-4 text-gray-500" />;
   }
}

function getStatusBadge(status: string | null) {
   const variant =
      status === "completed"
         ? "default"
         : status === "failed"
           ? "destructive"
           : "secondary";
   return (
      <Badge variant={variant} className="capitalize">
         {getStatusIcon(status)}
         <span className="ml-1">{status || "Not started"}</span>
      </Badge>
   );
}

function getCompanyInitials(name: string): string {
   return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
}

export function CompetitorDetailsPage() {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const [showEditDialog, setShowEditDialog] = useState(false);
   const queryClient = useQueryClient();

   const { data: competitor } = useSuspenseQuery(
      trpc.competitor.get.queryOptions({ id }),
   );

   // Calculate subscription enabled state using useMemo
   const isAnalyzingFeatures = useMemo(
      () =>
         competitor?.featuresStatus &&
         ["pending", "crawling", "analyzing"].includes(
            competitor.featuresStatus,
         ),
      [competitor?.featuresStatus],
   );

   const isAnalyzingAnalysis = useMemo(
      () =>
         competitor?.analysisStatus &&
         ["pending", "analyzing", "chunking"].includes(
            competitor.analysisStatus,
         ),
      [competitor?.analysisStatus],
   );

   useSubscription(
      trpc.competitor.onFeaturesStatusChanged.subscriptionOptions(
         {
            competitorId: id,
         },
         {
            async onData(data) {
               toast.success(
                  `Competitor features status updated to ${data.status}`,
               );
               await queryClient.invalidateQueries({
                  queryKey: trpc.competitor.get.queryKey({
                     id,
                  }),
               });
            },
            enabled: Boolean(isAnalyzingFeatures),
         },
      ),
   );

   useSubscription(
      trpc.competitor.onAnalysisStatusChanged.subscriptionOptions(
         {
            competitorId: id,
         },
         {
            async onData(data) {
               toast.success(
                  `Competitor analysis status updated to ${data.status}${data.message ? `: ${data.message}` : ""}`,
               );
               await queryClient.invalidateQueries({
                  queryKey: trpc.competitor.get.queryKey({
                     id,
                  }),
               });
            },
            enabled: Boolean(isAnalyzingAnalysis),
         },
      ),
   );

   // Type-safe access to potentially new fields
   const competitorData = competitor as any;
   const logoPath = competitorData.logoPath as string | undefined;
   const brandName = competitorData.brandName as string | undefined;
   const brandDescription = competitorData.brandDescription as
      | string
      | undefined;
   const brandSummary = competitorData.brandSummary as string | undefined;

   const logoUrl = logoPath
      ? `/api/files/proxy?path=${encodeURIComponent(logoPath)}`
      : null;
   const displayName = brandName || competitor.name;

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            {!isAnalyzingAnalysis && (
               <TalkingMascot message="View detailed information about this competitor and track their features!" />
            )}

            {isAnalyzingAnalysis && competitor?.featuresStatus ? (
               <CompetitorLoadingDisplay status={competitor.featuresStatus} />
            ) : (
               <div className="space-y-6">
                  {/* Header with Logo and Basic Info */}
                  <Card>
                     <CardHeader>
                        <div className="flex items-start gap-4">
                           <Avatar className="h-16 w-16">
                              <AvatarImage
                                 src={logoUrl || undefined}
                                 alt={displayName + " logo"}
                              />
                              <AvatarFallback className="text-lg font-semibold">
                                 {getCompanyInitials(displayName || "Company")}
                              </AvatarFallback>
                           </Avatar>
                           <div className="flex-1">
                              <CardTitle className="text-2xl">
                                 {displayName}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                 <Globe className="h-4 w-4" />
                                 {competitor.websiteUrl}
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                       window.open(
                                          competitor.websiteUrl,
                                          "_blank",
                                       )
                                    }
                                    className="h-6 w-6 p-0"
                                 >
                                    <ExternalLink className="h-3 w-3" />
                                 </Button>
                              </CardDescription>
                              {brandDescription && (
                                 <p className="text-sm text-muted-foreground mt-2">
                                    {brandDescription}
                                 </p>
                              )}
                           </div>
                        </div>
                     </CardHeader>
                  </Card>

                  {/* Tabbed Content */}
                  <Tabs defaultValue="overview" className="w-full">
                     <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="brand">Brand Analysis</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="files">Files & Assets</TabsTrigger>
                     </TabsList>

                     <TabsContent value="overview" className="space-y-4">
                        <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                           <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                              <CompetitorStatsCard />
                           </div>
                           <div className="col-span-1 gap-4 flex flex-col">
                              <CompetitorDetailsActions
                                 competitor={competitor}
                              />
                              <CompetitorInfoCard
                                 name={competitor.name}
                                 websiteUrl={competitor.websiteUrl}
                                 createdAt={competitor.createdAt}
                                 updatedAt={competitor.updatedAt}
                              />
                           </div>
                        </div>
                     </TabsContent>

                     <TabsContent value="brand" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                           {/* Brand Analysis Status */}
                           <Card>
                              <CardHeader>
                                 <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Brand Analysis Status
                                 </CardTitle>
                              </CardHeader>
                              <CardContent>
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                       <span className="text-sm font-medium">
                                          Analysis Status
                                       </span>
                                       {getStatusBadge(
                                          competitor.analysisStatus,
                                       )}
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                       <div>
                                          <span className="text-muted-foreground">
                                             Created:
                                          </span>
                                          <br />
                                          {new Date(
                                             competitor.createdAt,
                                          ).toLocaleDateString()}
                                       </div>
                                       <div>
                                          <span className="text-muted-foreground">
                                             Updated:
                                          </span>
                                          <br />
                                          {new Date(
                                             competitor.updatedAt,
                                          ).toLocaleDateString()}
                                       </div>
                                    </div>
                                 </div>
                              </CardContent>
                           </Card>

                           {/* Brand Information */}
                           <Card>
                              <CardHeader>
                                 <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" />
                                    Brand Assets
                                 </CardTitle>
                              </CardHeader>
                              <CardContent>
                                 <div className="space-y-4">
                                    {logoPath ? (
                                       <div className="flex items-center gap-3">
                                          <Avatar className="h-12 w-12">
                                             <AvatarImage
                                                src={logoUrl || undefined}
                                                alt="Company logo"
                                             />
                                             <AvatarFallback>
                                                {getCompanyInitials(
                                                   displayName || "Company",
                                                )}
                                             </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                             <p className="text-sm font-medium">
                                                Company Logo
                                             </p>
                                             <p className="text-xs text-muted-foreground">
                                                {logoPath.split("/").pop()}
                                             </p>
                                          </div>
                                          <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() =>
                                                window.open(
                                                   logoUrl || "#",
                                                   "_blank",
                                                )
                                             }
                                          >
                                             <Download className="h-4 w-4 mr-1" />
                                             Download
                                          </Button>
                                       </div>
                                    ) : (
                                       <div className="text-center py-6 text-muted-foreground">
                                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                          <p>No logo available</p>
                                       </div>
                                    )}
                                 </div>
                              </CardContent>
                           </Card>
                        </div>

                        {/* Brand Summary */}
                        {brandSummary && (
                           <Card>
                              <CardHeader>
                                 <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Brand Analysis Summary
                                 </CardTitle>
                              </CardHeader>
                              <CardContent>
                                 <div className="prose prose-sm max-w-none">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                       {brandSummary}
                                    </p>
                                 </div>
                              </CardContent>
                           </Card>
                        )}
                     </TabsContent>

                     <TabsContent value="features" className="space-y-4">
                        <CompetitorFeaturesCard
                           features={competitor.features}
                        />
                     </TabsContent>

                     <TabsContent value="files" className="space-y-4">
                        <Card>
                           <CardHeader>
                              <CardTitle>Files & Assets</CardTitle>
                              <CardDescription>
                                 Download and manage competitor analysis files
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <div className="space-y-3">
                                 {logoPath && (
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                       <div className="flex items-center gap-3">
                                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                          <div>
                                             <p className="font-medium">
                                                Company Logo
                                             </p>
                                             <p className="text-sm text-muted-foreground">
                                                {logoPath.split("/").pop()}
                                             </p>
                                          </div>
                                       </div>
                                       <div className="flex gap-2">
                                          <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() =>
                                                window.open(
                                                   logoUrl || "#",
                                                   "_blank",
                                                )
                                             }
                                          >
                                             View
                                          </Button>
                                          <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() => {
                                                const link =
                                                   document.createElement("a");
                                                link.href = logoUrl || "#";
                                                link.download =
                                                   logoPath.split("/").pop() ||
                                                   "logo";
                                                link.click();
                                             }}
                                          >
                                             <Download className="h-4 w-4" />
                                          </Button>
                                       </div>
                                    </div>
                                 )}
                                 {!logoPath && (
                                    <div className="text-center py-8 text-muted-foreground">
                                       <FileText className="h-8 w-8 mx-auto mb-2" />
                                       <p>No files available</p>
                                    </div>
                                 )}
                              </div>
                           </CardContent>
                        </Card>
                     </TabsContent>
                  </Tabs>
               </div>
            )}
         </main>

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />
      </>
   );
}
