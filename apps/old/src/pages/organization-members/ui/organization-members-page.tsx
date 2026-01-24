import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
   MembersDataTable,
   MembersDataTableSkeleton,
} from "@/features/organization/ui/members-data-table";
import { useTRPC } from "@/integrations/clients";
import { MembersQuickActionsToolbar } from "./organization-members-quick-actions-toolbar";

function MembersPageContent() {
   const trpc = useTRPC();
   const [searchTerm, setSearchTerm] = useState("");
   const [roleFilter, setRoleFilter] = useState("all");

   const { data: members } = useSuspenseQuery(
      trpc.organization.getActiveOrganizationMembers.queryOptions(),
   );

   const hasActiveFilters = roleFilter !== "all";

   const handleClearFilters = () => {
      setRoleFilter("all");
   };

   return (
      <MembersDataTable
         filters={{
            hasActiveFilters,
            onClearFilters: handleClearFilters,
            onRoleFilterChange: setRoleFilter,
            onSearchChange: setSearchTerm,
            roleFilter,
            searchTerm,
         }}
         members={members}
      />
   );
}

function MembersPageError({ error }: { error: Error }) {
   return (
      <div className="text-center py-8">
         <p className="text-muted-foreground">
            {"Ocorreu um erro. Por favor, tente novamente."}
         </p>
         <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </div>
   );
}

export function OrganizationMembersPage() {
   return (
      <main className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold">{"Title"}</h1>
               <p className="text-muted-foreground">{"Description"}</p>
            </div>
            <MembersQuickActionsToolbar />
         </div>

         <ErrorBoundary FallbackComponent={MembersPageError}>
            <Suspense fallback={<MembersDataTableSkeleton />}>
               <MembersPageContent />
            </Suspense>
         </ErrorBoundary>
      </main>
   );
}
