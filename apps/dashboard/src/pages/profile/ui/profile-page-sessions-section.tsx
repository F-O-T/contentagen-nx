import { useEffect, useState } from "react";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import {
   Table,
   TableHeader,
   TableBody,
   TableRow,
   TableHead,
   TableCell,
} from "@packages/ui/components/table";
import { betterAuthClient } from "@/integrations/clients";
import { Trash2, Monitor, Smartphone, CheckCircle2 } from "lucide-react";

export function ProfilePageSessionsSection() {
   const [sessions, setSessions] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [deletingId, setDeletingId] = useState<string | null>(null);
   const [currentSessionId, setCurrentSessionId] = useState<string | null>(
      null,
   );

   const fetchSessions = async () => {
      setLoading(true);
      try {
         const { data: sessionList } = await betterAuthClient.listSessions();
         setSessions(sessionList || []);
         // Get current session
         const { data: currentSession } = await betterAuthClient.getSession();
         setCurrentSessionId(currentSession?.id || null);
      } catch (e: any) {
         setError(e?.message || "Failed to load sessions");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchSessions();
   }, []);

   const handleDelete = async (token: string) => {
      if (!window.confirm("Are you sure you want to revoke this session?"))
         return;
      setDeletingId(token);
      setError(null);
      try {
         await betterAuthClient.revokeSession({ token });
         fetchSessions();
      } catch (e: any) {
         setError(e?.message || "Failed to revoke session");
      } finally {
         setDeletingId(null);
      }
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
               View and manage your active sessions. Revoke any session to log
               out from that device.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4 px-6">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex flex-wrap gap-2 mb-4">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                     await betterAuthClient.revokeOtherSessions();
                     fetchSessions();
                  }}
               >
                  Revoke Other Sessions
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                     await betterAuthClient.revokeSessions();
                     fetchSessions();
                  }}
               >
                  Revoke All Sessions
               </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {" "}
               {loading ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                     Loading...
                  </div>
               ) : sessions.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                     No active sessions found.
                  </div>
               ) : (
                  sessions.map((s) => {
                     const isCurrent =
                        s.token === currentSessionId ||
                        s.id === currentSessionId;
                     return (
                        <div
                           key={s.id}
                           className={`relative flex flex-col gap-3 rounded-xl bg-muted shadow-md border p-5 transition hover:shadow-lg ${isCurrent ? "ring-2 ring-green-400" : ""}`}
                        >
                           <div className="flex items-center gap-3">
                              <div
                                 className={`rounded-full p-2 bg-accent flex items-center justify-center shadow-sm ${isCurrent ? "ring-2 ring-green-400" : ""}`}
                              >
                                 {s.userAgent?.includes("Mobile") ? (
                                    <Smartphone className="w-6 h-6 text-primary" />
                                 ) : (
                                    <Monitor className="w-6 h-6 text-primary" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="font-medium truncate text-base">
                                    {s.userAgent || "Unknown Device"}
                                 </div>
                                 <div className="text-xs text-muted-foreground truncate">
                                    IP: {s.ipAddress || "-"}
                                 </div>
                              </div>
                              {isCurrent && (
                                 <span className="text-green-600 flex items-center gap-1 text-xs font-semibold">
                                    <CheckCircle2 className="w-4 h-4" /> Current
                                 </span>
                              )}
                           </div>
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
                           <div className="flex justify-end gap-2 mt-2">
                              {!isCurrent && (
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                       handleDelete(s.token || s.id)
                                    }
                                    disabled={deletingId === (s.token || s.id)}
                                    title="Revoke Session"
                                    className="text-destructive border-destructive hover:bg-destructive/10"
                                 >
                                    <Trash2 className="w-4 h-4 mr-1" /> Revoke
                                 </Button>
                              )}{" "}
                           </div>
                        </div>
                     );
                  })
               )}
            </div>{" "}
         </CardContent>
      </Card>
   );
}
