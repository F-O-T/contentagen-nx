import { betterAuthClient } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardAction,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import {
   Table,
   TableHeader,
   TableBody,
   TableHead,
   TableRow,
   TableCell,
} from "@packages/ui/components/table";
import { Button } from "@packages/ui/components/button";
import { Key, MoreVertical } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CreateApiKeyCredenza } from "../features/create-api-key-credenza";
export function ApiKeyPage() {
   const [open, setOpen] = useState(false);
   const { data } = useSuspenseQuery({
      queryKey: ["apiKeys"],
      queryFn: async () => {
         const { data, error } = await betterAuthClient.apiKey.list();
         if (error) throw new Error("Failed to load API keys");
         return data;
      },
   });

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>API Keys</CardTitle>
               <CardDescription>
                  Manage your API keys for programmatic access. You can view and
                  delete keys here.
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           aria-label="More actions"
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setOpen(true)}>
                           <Key />
                           Create API Key
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>API Key</TableHead>
                        <TableHead>Requests/Day</TableHead>
                        <TableHead>Request Count</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="w-8" />
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {data.map((key) => (
                        <TableRow key={key.id}>
                           <TableCell>
                              {key.name || (
                                 <span className="text-muted-foreground">
                                    —
                                 </span>
                              )}
                           </TableCell>
                           <TableCell>
                              {key.start || (
                                 <span className="text-muted-foreground">
                                    —
                                 </span>
                              )}
                           </TableCell>
                           <TableCell>{key.rateLimitMax ?? "—"}</TableCell>
                           <TableCell>{key.requestCount ?? "—"}</TableCell>
                           <TableCell>
                              {key.createdAt
                                 ? new Date(key.createdAt).toLocaleString()
                                 : "—"}
                           </TableCell>
                           <TableCell className="text-right">
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       aria-label="API Key actions"
                                    >
                                       <MoreVertical className="w-5 h-5" />
                                    </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                       className="text-red-600"
                                       onSelect={() => {
                                          // TODO: implement delete logic
                                       }}
                                    >
                                       Delete
                                    </DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
         <CreateApiKeyCredenza open={open} onOpenChange={setOpen} />
      </>
   );
}
