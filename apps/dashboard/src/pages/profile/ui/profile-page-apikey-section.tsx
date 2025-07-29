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
import {
   Copy,
   Eye,
   EyeOff,
   Plus,
   Trash2,
   Edit2,
   Check,
   XCircle,
} from "lucide-react";

export function ProfilePageApiKeySection() {
   const [apiKeys, setApiKeys] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [creating, setCreating] = useState(false);
   const [showKeyId, setShowKeyId] = useState<string | null>(null);
   const [newKey, setNewKey] = useState<any | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editName, setEditName] = useState<string>("");
   const [verifyingId, setVerifyingId] = useState<string | null>(null);
   const [verifyResult, setVerifyResult] = useState<any | null>(null);
   const [deletingExpired, setDeletingExpired] = useState(false);

   const fetchApiKeys = async () => {
      setLoading(true);
      try {
         const { data } = await betterAuthClient.apiKey.list();
         setApiKeys(data || []);
      } catch (e: any) {
         setError(e?.message || "Failed to load API keys");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchApiKeys();
   }, []);

   const handleCreate = async () => {
      setCreating(true);
      setError(null);
      try {
         const { data } = await betterAuthClient.apiKey.create();
         setNewKey(data);
         fetchApiKeys();
      } catch (e: any) {
         setError(e?.message || "Failed to create API key");
      } finally {
         setCreating(false);
      }
   };

   const handleDelete = async (keyId: string) => {
      if (!window.confirm("Are you sure you want to delete this API key?"))
         return;
      setLoading(true);
      setError(null);
      try {
         await betterAuthClient.apiKey.delete({ keyId });
         fetchApiKeys();
      } catch (e: any) {
         setError(e?.message || "Failed to delete API key");
      } finally {
         setLoading(false);
      }
   };

   const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
   const handleCopy = (key: string, id?: string) => {
      navigator.clipboard.writeText(key);
      if (id) {
         setCopiedKeyId(id);
         setTimeout(() => setCopiedKeyId(null), 1500);
      }
   };
   const handleEdit = (k: any) => {
      setEditingId(k.id);
      setEditName(k.name || "");
   };

   const handleEditSave = async (keyId: string) => {
      setLoading(true);
      setError(null);
      try {
         await betterAuthClient.apiKey.update({ keyId, name: editName });
         setEditingId(null);
         fetchApiKeys();
      } catch (e: any) {
         setError(e?.message || "Failed to update API key");
      } finally {
         setLoading(false);
      }
   };

   const handleVerify = async (k: any) => {
      setVerifyingId(k.id);
      setVerifyResult(null);
      try {
         const result = await betterAuthClient.apiKey.verify({ key: k.key });
         setVerifyResult(result);
      } catch (e: any) {
         setVerifyResult({
            valid: false,
            error: e?.message || "Verification failed",
         });
      }
   };

   const handleDeleteExpired = async () => {
      setDeletingExpired(true);
      setError(null);
      try {
         await betterAuthClient.apiKey.deleteAllExpiredApiKeys();
         fetchApiKeys();
      } catch (e: any) {
         setError(e?.message || "Failed to delete expired API keys");
      } finally {
         setDeletingExpired(false);
      }
   };

   // Only show newKey if it was just created and is not in the list
   const showNewKeyBox = newKey && !apiKeys.some((k) => k.id === newKey.id);
   const hasExpired = apiKeys.some(
      (k) => k.expiresAt && new Date(k.expiresAt) < new Date(),
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
               Manage your API keys for programmatic access. Keep them secure!
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4 px-6">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {showNewKeyBox && (
               <div className="bg-muted rounded-md p-3 flex flex-col gap-2 border border-primary/20">
                  <div className="flex items-center gap-2">
                     <span className="font-mono text-xs break-all">
                        {newKey.key}
                     </span>
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(newKey.key)}
                        title="Copy API Key"
                     >
                        <Copy className="w-4 h-4" />
                     </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                     Copy and store this key securely. You won't be able to see
                     it again.
                  </span>
               </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {loading ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                     Loading...
                  </div>
               ) : apiKeys.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                     No API keys found.
                  </div>
               ) : (
                  apiKeys.map((k) => {
                     const isEditing = editingId === k.id;
                     const isShowing = showKeyId === k.id;
                     return (
                        <div
                           key={k.id}
                           className="relative flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-muted dark:via-slate-900 dark:to-muted shadow-lg border border-slate-200 dark:border-slate-800 p-6 transition hover:shadow-2xl group hover:scale-[1.02] active:scale-[0.98] duration-150"
                        >
                           <div className="flex items-center gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                 {isEditing ? (
                                    <input
                                       className="border rounded px-2 py-1 text-sm w-full"
                                       value={editName}
                                       onChange={(e) =>
                                          setEditName(e.target.value)
                                       }
                                    />
                                 ) : (
                                    <div className="font-semibold truncate text-base tracking-tight">
                                       {k.name || "API Key"}
                                    </div>
                                 )}
                                 <div className="text-xs text-muted-foreground truncate">
                                    {k.metadata
                                       ? JSON.stringify(k.metadata)
                                       : ""}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 font-mono text-xs bg-gray-50 dark:bg-gray-900 rounded px-2 py-1">
                              <span>
                                 {isShowing
                                    ? k.key
                                    : `${k.key?.slice(0, 4) || ""}••••••••${k.key?.slice(-4) || ""}`}
                              </span>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={() =>
                                    setShowKeyId(isShowing ? null : k.id)
                                 }
                                 title={isShowing ? "Hide" : "Show"}
                              >
                                 {isShowing ? (
                                    <EyeOff className="w-4 h-4" />
                                 ) : (
                                    <Eye className="w-4 h-4" />
                                 )}
                              </Button>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={() =>
                                    k.key && handleCopy(k.key, k.id)
                                 }
                                 title={
                                    k.key
                                       ? copiedKeyId === k.id
                                          ? "Copied!"
                                          : "Copy API Key"
                                       : "You can only copy the key when it is first created. If you lost it, generate a new one."
                                 }
                                 disabled={!k.key}
                              >
                                 {copiedKeyId === k.id ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                 ) : (
                                    <Copy className="w-4 h-4" />
                                 )}
                              </Button>{" "}
                           </div>
                           <div className="flex flex-wrap gap-2 text-xs mt-1 items-center">
                              <span
                                 className={
                                    k.enabled
                                       ? "bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold"
                                       : "bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold"
                                 }
                              >
                                 {k.enabled ? "Enabled" : "Disabled"}
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                 Created:{" "}
                                 {k.createdAt
                                    ? new Date(k.createdAt).toLocaleDateString()
                                    : "-"}
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                 Expires:{" "}
                                 {k.expiresAt
                                    ? new Date(k.expiresAt).toLocaleDateString()
                                    : "Never"}
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                 Usage:{" "}
                                 {k.remaining != null
                                    ? `${k.remaining} left`
                                    : "∞"}
                                 {k.requestCount != null
                                    ? ` (${k.requestCount} used)`
                                    : ""}
                              </span>
                           </div>
                           <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              <span>
                                 Permissions:{" "}
                                 {k.permissions
                                    ? Object.entries(k.permissions)
                                         .map(
                                            ([res, acts]) =>
                                               `${res}: [${Array.isArray(acts) ? acts.join(",") : acts}]`,
                                         )
                                         .join("; ")
                                    : "-"}
                              </span>
                           </div>
                           <div className="flex justify-end gap-2 mt-2">
                              {isEditing ? (
                                 <>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => handleEditSave(k.id)}
                                       title="Save"
                                    >
                                       <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => setEditingId(null)}
                                       title="Cancel"
                                    >
                                       <XCircle className="w-4 h-4" />
                                    </Button>
                                 </>
                              ) : (
                                 <>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => handleEdit(k)}
                                       title="Edit Name"
                                    >
                                       <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => handleVerify(k)}
                                       title="Verify"
                                    >
                                       <Check className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => handleDelete(k.id)}
                                       title="Delete"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </>
                              )}
                              {verifyingId === k.id && verifyResult && (
                                 <span
                                    className={
                                       verifyResult.valid
                                          ? "text-green-600 text-xs ml-2"
                                          : "text-red-600 text-xs ml-2"
                                    }
                                 >
                                    {verifyResult.valid
                                       ? "Valid"
                                       : `Invalid: ${verifyResult.error?.message || verifyResult.error}`}
                                 </span>
                              )}
                           </div>
                        </div>
                     );
                  })
               )}
            </div>{" "}
            <div className="flex justify-between pt-2">
               {hasExpired && (
                  <Button
                     onClick={handleDeleteExpired}
                     disabled={deletingExpired}
                     size="sm"
                     variant="outline"
                  >
                     Delete Expired Keys
                  </Button>
               )}
               <Button onClick={handleCreate} disabled={creating} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> New API Key
               </Button>
            </div>
         </CardContent>
      </Card>
   );
}
