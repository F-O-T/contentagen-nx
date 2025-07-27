import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";
import { betterAuthClient } from "@/integrations/clients";
import { InfoItem } from "@packages/ui/components/info-item";
import { User as UserIcon, Mail as MailIcon } from "lucide-react";

import { useEffect, useState } from "react";

export function ProfileInformation() {
   const [newEmail, setNewEmail] = useState("");
   const [emailLoading, setEmailLoading] = useState(false);
   const [emailError, setEmailError] = useState("");
   const [emailSuccess, setEmailSuccess] = useState("");

   const handleChangeEmail = async () => {
      setEmailLoading(true);
      setEmailError("");
      setEmailSuccess("");
      try {
         await betterAuthClient.changeEmail({
            newEmail,
            callbackURL: "/profile?emailChanged=1",
         });
         setEmailSuccess("Verification email sent. Please check your inbox.");
      } catch (e) {
         setEmailError(e?.message || "Failed to change email.");
      } finally {
         setEmailLoading(false);
      }
   };

   const [currentPassword, setCurrentPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [passwordLoading, setPasswordLoading] = useState(false);
   const [passwordError, setPasswordError] = useState("");
   const [passwordSuccess, setPasswordSuccess] = useState("");

   const handleChangePassword = async () => {
      setPasswordLoading(true);
      setPasswordError("");
      setPasswordSuccess("");
      try {
         await betterAuthClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
         });
         setPasswordSuccess("Password changed successfully.");
         setCurrentPassword("");
         setNewPassword("");
      } catch (e) {
         setPasswordError(e?.message || "Failed to change password.");
      } finally {
         setPasswordLoading(false);
      }
   };

   const [deleteLoading, setDeleteLoading] = useState(false);
   const [deleteError, setDeleteError] = useState("");
   const [deleteSuccess, setDeleteSuccess] = useState("");

   const handleDeleteAccount = async () => {
      if (
         !window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone.",
         )
      )
         return;
      setDeleteLoading(true);
      setDeleteError("");
      setDeleteSuccess("");
      try {
         await betterAuthClient.deleteUser({ callbackURL: "/goodbye" });
         setDeleteSuccess("Account deleted. Redirecting...");
         // Optionally, redirect after a short delay
         setTimeout(() => {
            window.location.href = "/goodbye";
         }, 1500);
      } catch (e) {
         setDeleteError(e?.message || "Failed to delete account.");
      } finally {
         setDeleteLoading(false);
      }
   };

   const { data: session, refetch } = betterAuthClient.useSession();
   const [name, setName] = useState(session?.user?.name || "");
   const [image, setImage] = useState(session?.user?.image || "");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [success, setSuccess] = useState("");

   const handleSave = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
         await betterAuthClient.updateUser({ name, image });
         setSuccess("Profile updated successfully.");
         refetch?.();
      } catch (e) {
         setError(e?.message || "Failed to update profile.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
               Update your personal information and account details.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
               <label className="font-medium flex items-center gap-2">
                  <UserIcon size={16} /> Name
               </label>
               <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  disabled={loading}
               />
            </div>
            <div className="flex flex-col gap-2">
               <label className="font-medium flex items-center gap-2">
                  <UserIcon size={16} /> Profile Image URL
               </label>
               <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="input"
                  disabled={loading}
               />
               {image && (
                  <img
                     src={image}
                     alt="Profile preview"
                     className="w-16 h-16 rounded-full mt-2"
                  />
               )}
            </div>
            <div className="flex gap-2 mt-4">
               <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={loading}
               >
                  {loading ? "Saving..." : "Save"}
               </button>
               {success && <span className="text-green-600">{success}</span>}
               {error && <span className="text-red-600">{error}</span>}
            </div>
            <div className="flex flex-col gap-2 mt-4">
               <label className="font-medium flex items-center gap-2">
                  <MailIcon size={16} /> Email
               </label>
               <div className="flex items-center gap-2">
                  <span>{session?.user?.email || "—"}</span>
               </div>
               <input
                  type="email"
                  placeholder="New email"
                  className="input mt-2"
                  value={newEmail || ""}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={emailLoading}
               />
               <button
                  onClick={handleChangeEmail}
                  className="btn btn-secondary mt-2"
                  disabled={emailLoading || !newEmail}
               >
                  {emailLoading ? "Sending verification..." : "Change Email"}
               </button>
               {emailSuccess && (
                  <span className="text-green-600">{emailSuccess}</span>
               )}
               {emailError && (
                  <span className="text-red-600">{emailError}</span>
               )}
            </div>
            <div className="flex flex-col gap-2 mt-8">
               <label className="font-medium">Change Password</label>
               <input
                  type="password"
                  placeholder="Current password"
                  className="input"
                  value={currentPassword || ""}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
               />
               <input
                  type="password"
                  placeholder="New password"
                  className="input mt-2"
                  value={newPassword || ""}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
               />
               <button
                  onClick={handleChangePassword}
                  className="btn btn-secondary mt-2"
                  disabled={passwordLoading || !currentPassword || !newPassword}
               >
                  {passwordLoading ? "Changing..." : "Change Password"}
               </button>
               {passwordSuccess && (
                  <span className="text-green-600">{passwordSuccess}</span>
               )}
               {passwordError && (
                  <span className="text-red-600">{passwordError}</span>
               )}
            </div>
            <div className="flex flex-col gap-2 mt-8 border-t pt-4">
               <label className="font-medium text-red-600">Danger Zone</label>
               <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger mt-2"
                  disabled={deleteLoading}
               >
                  {deleteLoading ? "Deleting..." : "Delete Account"}
               </button>
               {deleteSuccess && (
                  <span className="text-green-600">{deleteSuccess}</span>
               )}
               {deleteError && (
                  <span className="text-red-600">{deleteError}</span>
               )}
            </div>
            <div className="flex flex-col gap-2 mt-8 border-t pt-4">
               <label className="font-medium">Linked Accounts</label>
               <LinkedAccountsSection />
            </div>
         </CardContent>
      </Card>
   );
}

function LinkedAccountsSection() {
   const [accounts, setAccounts] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [linking, setLinking] = useState("");
   const [unlinking, setUnlinking] = useState("");

   const fetchAccounts = async () => {
      setLoading(true);
      setError("");
      try {
         const data = await betterAuthClient.listAccounts();
         setAccounts(data || []);
      } catch (e) {
         setError(e?.message || "Failed to load linked accounts");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchAccounts();
   }, []);

   const handleLink = async (provider: string) => {
      setLinking(provider);
      setError("");
      try {
         await betterAuthClient.linkSocial({
            provider,
            callbackURL: "/profile",
         });
         fetchAccounts();
      } catch (e) {
         setError(e?.message || `Failed to link ${provider}`);
      } finally {
         setLinking("");
      }
   };

   const handleUnlink = async (providerId: string, accountId: string) => {
      setUnlinking(accountId);
      setError("");
      try {
         await betterAuthClient.unlinkAccount({ providerId, accountId });
         fetchAccounts();
      } catch (e) {
         setError(e?.message || `Failed to unlink account`);
      } finally {
         setUnlinking("");
      }
   };

   // Example providers, adjust as needed
   const availableProviders = ["google"];

   return (
      <div className="flex flex-col gap-2">
         {error && <span className="text-red-600">{error}</span>}
         {loading ? <span>Loading...</span> : <></>}
      </div>
   );
}
