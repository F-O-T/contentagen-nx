import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardAction,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { betterAuthClient } from "@/integrations/clients";
import { Trash2, CheckCircle2, MoreVertical } from "lucide-react";
import {
   useSuspenseQuery,
   useMutation,
   useQueryClient,
} from "@tanstack/react-query";
import { translate } from "@packages/localization";

export function ProfilePageSessionsSection() {
   const queryClient = useQueryClient();

   // Fetch sessions and current session in parallel
   const { data: sessions } = useSuspenseQuery({
      queryKey: ["sessions"],
      queryFn: async () => {
         const { data } = await betterAuthClient.listSessions();
         return data || [];
      },
   });
   const { data: currentSession } = useSuspenseQuery({
      queryKey: ["currentSession"],
      queryFn: async () => {
         const { data } = await betterAuthClient.getSession();
         return data;
      },
   });
   const currentSessionId = currentSession?.session.id || null;

   // Mutations
   const revokeSessionMutation = useMutation({
      mutationFn: async (token: string) => {
         await betterAuthClient.revokeSession({ token });
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
   });
   const revokeOtherSessionsMutation = useMutation({
      mutationFn: async () => {
         await betterAuthClient.revokeOtherSessions();
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
   });
   const revokeAllSessionsMutation = useMutation({
      mutationFn: async () => {
         await betterAuthClient.revokeSessions();
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["sessions"] });
      },
   });

   function handleDelete(token: string) {
      if (!window.confirm(translate("pages.profile.sessions.revoke-confirm")))
         return;
      revokeSessionMutation.mutate(token);
   }

   return (
      <Card>
         <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
               <div>
                  <CardTitle>
                     {translate("pages.profile.sessions.sessions-title")}
                  </CardTitle>
                  <CardDescription>
                     {translate("pages.profile.sessions.sessions-description")}
                  </CardDescription>
               </div>
               <div className="mt-2 sm:mt-0">
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           aria-label={translate(
                              "pages.profile.sessions.manage-sessions",
                           )}
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>{" "}
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem
                           onSelect={(e) => {
                              e.preventDefault();
                              revokeOtherSessionsMutation.mutate();
                           }}
                           disabled={revokeOtherSessionsMutation.isPending}
                        >
                           <Trash2 className="w-4 h-4 mr-2" />
                           {revokeOtherSessionsMutation.isPending
                              ? translate(
                                   "pages.profile.sessions.revoke-other-loading",
                                )
                              : translate(
                                   "pages.profile.sessions.revoke-other",
                                )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onSelect={(e) => {
                              e.preventDefault();
                              revokeAllSessionsMutation.mutate();
                           }}
                           disabled={revokeAllSessionsMutation.isPending}
                           variant="destructive"
                        >
                           <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                           {revokeAllSessionsMutation.isPending
                              ? translate(
                                   "pages.profile.sessions.revoke-all-loading",
                                )
                              : translate(
                                   "pages.profile.sessions.revoke-all-sessions",
                                )}
                        </DropdownMenuItem>{" "}
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
         </CardHeader>
         <CardContent className="space-y-4 px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {sessions.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                     {translate("pages.profile.sessions.no-sessions")}
                  </div>
               ) : (
                  sessions.map((s) => {
                     const isCurrent =
                        s.token === currentSessionId ||
                        s.id === currentSessionId;
                     return (
                        <Card
                           key={s.id}
                           className={`relative transition hover:shadow-lg ${isCurrent ? "ring-1 ring-primary/80" : ""}`}
                        >
                           <CardHeader>
                              <CardTitle className="truncate text-base">
                                 {s.userAgent ||
                                    translate(
                                       "pages.profile.sessions.unknown-device",
                                    )}
                              </CardTitle>
                              <CardDescription className="truncate">
                                 {translate(
                                    "pages.profile.sessions.ip-address",
                                 )}{" "}
                                 {s.ipAddress || "-"}
                              </CardDescription>
                              {isCurrent && (
                                 <span className="text-green-600 flex items-center gap-1 text-xs font-semibold">
                                    <CheckCircle2 className="w-4 h-4" />{" "}
                                    {translate(
                                       "pages.profile.sessions.current",
                                    )}
                                 </span>
                              )}
                              <CardAction>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label={translate(
                                             "pages.profile.sessions.session-actions",
                                          )}
                                          disabled={
                                             revokeSessionMutation.isPending
                                          }
                                       >
                                          <MoreVertical className="w-5 h-5" />
                                       </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                       <DropdownMenuItem
                                          onSelect={(e) => {
                                             e.preventDefault();
                                             handleDelete(s.token || s.id);
                                          }}
                                          disabled={
                                             revokeSessionMutation.isPending
                                          }
                                          variant="destructive"
                                       >
                                          <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                                          {revokeSessionMutation.isPending
                                             ? translate(
                                                  "pages.profile.sessions.revoke-session-loading",
                                               )
                                             : translate(
                                                  "pages.profile.sessions.revoke-session",
                                               )}
                                       </DropdownMenuItem>
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                              </CardAction>
                           </CardHeader>
                           <CardContent>
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                 <span>
                                    {translate(
                                       "pages.profile.sessions.created",
                                    )}{" "}
                                    {s.createdAt
                                       ? new Date(s.createdAt).toLocaleString()
                                       : "-"}
                                 </span>
                                 <span>
                                    {translate(
                                       "pages.profile.sessions.last-active",
                                    )}{" "}
                                    {s.updatedAt
                                       ? new Date(s.updatedAt).toLocaleString()
                                       : "-"}
                                 </span>
                              </div>
                           </CardContent>
                        </Card>
                     );
                  })
               )}
            </div>{" "}
         </CardContent>
      </Card>
   );
}
