import { useTRPC } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardAction,
} from "@packages/ui/components/card";
import { translate } from "@packages/localization";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";

import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import { Key, MoreVertical } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { CreateApiKeyCredenza } from "../features/create-api-key-credenza";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { DeleteApiKeyCredenza } from "../features/delete-api-key-credenza";
import { formatWindow } from "@packages/helpers/number";
import { UpdateApiKeyCredenza } from "../features/update-api-key-credenza";

interface ModalState {
   type: "none" | "create" | "delete" | "update";
   keyId?: string;
   keyName?: string;
}

export function ApiKeyPage() {
   // Combine all modal and related state into one object
   const [modalState, setModalState] = useState<ModalState>({ type: "none" });
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.authHelpers.getApiKeys.queryOptions(),
   );

   // Modal open/close handlers
   const openCreate = useCallback(() => setModalState({ type: "create" }), []);
   const openDelete = useCallback(
      (keyId: string) => setModalState({ type: "delete", keyId }),
      [],
   );
   const openUpdate = useCallback(
      (keyId: string, keyName: string) =>
         setModalState({ type: "update", keyId, keyName }),
      [],
   );
   const closeModal = useCallback(() => setModalState({ type: "none" }), []);

   const formatKeyStart = useCallback((start?: string | null) => {
      if (!start) return translate("pages.api-key.table.not-found");
      return `${start.slice(0, 8)}...`;
   }, []);

   const stats = useMemo(() => {
      return [
         {
            label: translate("pages.api-key.statistics.total-keys"),
            value: data.length,
         },
         {
            label: translate("pages.api-key.statistics.total-usage"),
            value: data.reduce((sum, k) => sum + (k.requestCount ?? 0), 0),
         },
      ];
   }, [data]);

   const formatRateLimit = useCallback((key: (typeof data)[0]) => {
      if (key.rateLimitMax && key.rateLimitTimeWindow) {
         return `${key.requestCount ?? 0} used - ${key.rateLimitMax} per ${formatWindow(key.rateLimitTimeWindow)}`;
      }
      return translate("pages.api-key.table.unlimited");
   }, []);

   return (
      <div className="flex flex-col gap-4">
         <TalkingMascot message={translate("pages.api-key.mascot-message")} />
         <div className="grid grid-cols-1 md:grid-cols-3  gap-4">
            <Card className="col-span-1 order-first md:order-last ">
               <CardHeader>
                  <CardTitle>{translate("pages.api-key.statistics.title")}</CardTitle>
                  <CardDescription>
                     {translate("pages.api-key.statistics.description")}
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
                           <DropdownMenuItem onSelect={openCreate}>
                              <Key />
                              {translate("pages.api-key.actions.create")}
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </CardAction>
               </CardHeader>
               <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.map((stat) => (
                     <div
                        key={stat.label}
                        className="flex flex-col items-center justify-center"
                     >
                        <span className="font-semibold text-lg">
                           {stat.value}
                        </span>
                        <span className="text-muted-foreground text-sm">
                           {stat.label}
                        </span>
                     </div>
                  ))}
               </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
               <CardHeader>
                  <CardTitle>{translate("pages.api-key.section.title")}</CardTitle>
                  <CardDescription>
                     {translate("pages.api-key.section.description")}
                  </CardDescription>
                  {/* CardAction removed dropdown menu */}
               </CardHeader>
               <CardContent className=" flex flex-col gap-4">
                  {data.map((key) => (
                     <div
                        key={key.id}
                        className="flex items-center justify-between border-1 p-2 rounded-lg "
                     >
                        <div className="flex flex-col min-w-0">
                           <span className="font-medium text-base truncate">
                              {key.name || (
                                 <span className="text-muted-foreground">
                                    —
                                 </span>
                              )}
                           </span>
                           <span className="text-sm text-muted-foreground">
                              {formatRateLimit(key)}
                           </span>
                        </div>
                        <div className="flex items-center gap-4 min-w-0">
                           <Badge variant={"outline"} title={key.start ?? ""}>
                              {formatKeyStart(key.start)}
                           </Badge>
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
                                    onSelect={() =>
                                       openUpdate(key.id, key.name || "")
                                    }
                                 >
                                    {translate("pages.api-key.actions.update")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    className="text-red-600"
                                    onSelect={() => {
                                       openDelete(key.id);
                                    }}
                                 >
                                    {translate("pages.api-key.actions.delete")}
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     </div>
                  ))}
               </CardContent>
            </Card>
         </div>
         {/* API Keys Card */}
         <DeleteApiKeyCredenza
            open={modalState.type === "delete"}
            onOpenChange={closeModal}
            keyId={modalState.keyId ?? ""}
         />
         <UpdateApiKeyCredenza
            initialName={modalState.keyName ?? ""}
            open={modalState.type === "update"}
            onOpenChange={closeModal}
            keyId={modalState.keyId ?? ""}
         />
         <CreateApiKeyCredenza
            open={modalState.type === "create"}
            onOpenChange={closeModal}
         />
      </div>
   );
}
