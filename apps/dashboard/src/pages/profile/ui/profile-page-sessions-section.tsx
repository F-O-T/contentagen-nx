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
      if (!window.confirm("Are you sure you want to revoke this session?"))
         return;
      revokeSessionMutation.mutate(token);
   }

   return (
      <Card>
         <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
               <div>
                  <CardTitle>Sessions</CardTitle>
                  <CardDescription>
                     View and manage your active sessions. Revoke any session to
                     log out from that device.
                  </CardDescription>
               </div>
               <div className="mt-2 sm:mt-0">
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           aria-label="Manage Sessions"
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
                              ? "Revoking Other Sessions..."
                              : "Revoke Other Sessions"}
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
                              ? "Revoking All Sessions..."
                              : "Revoke All Sessions"}
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
                     No active sessions found.
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
                                 {s.userAgent || "Unknown Device"}
                              </CardTitle>
                              <CardDescription className="truncate">
                                 IP: {s.ipAddress || "-"}
                              </CardDescription>
                              {isCurrent && (
                                 <span className="text-green-600 flex items-center gap-1 text-xs font-semibold">
                                    <CheckCircle2 className="w-4 h-4" /> Current
                                 </span>
                              )}
                              <CardAction>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label="Session Actions"
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
                                             ? "Revoking..."
                                             : "Revoke Session"}
                                       </DropdownMenuItem>
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                              </CardAction>
                           </CardHeader>
                           <CardContent>
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                 <span>
                                    Created:{" "}
                                    {s.createdAt
                                       ? new Date(s.createdAt).toLocaleString()
                                       : "-"}
                                 </span>
                                 <span>
                                    Last Active:{" "}
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
