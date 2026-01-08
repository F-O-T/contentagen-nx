import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { Check, Clock, Crown, Shield, User, X, XCircle } from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";

interface InvitesFilterCredenzaProps {
   statusFilter: string;
   onStatusFilterChange: (value: string) => void;
   roleFilter: string;
   onRoleFilterChange: (value: string) => void;
   onClearFilters: () => void;
   hasActiveFilters: boolean;
}

export function InvitesFilterCredenza({
   statusFilter,
   onStatusFilterChange,
   roleFilter,
   onRoleFilterChange,
   onClearFilters,
   hasActiveFilters,
}: InvitesFilterCredenzaProps) {
   const { closeCredenza } = useCredenza();

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Status"}</CredenzaTitle>
         </CredenzaHeader>
         <CredenzaBody className="space-y-4">
            <div className="space-y-2">
               <p className="text-sm font-medium">{"Status"}</p>
               <ToggleGroup
                  className="flex-wrap justify-start"
                  onValueChange={(value) =>
                     onStatusFilterChange(value || "all")
                  }
                  type="single"
                  value={statusFilter === "all" ? "" : statusFilter}
               >
                  <ToggleGroupItem aria-label="Pending" value="pending">
                     <Clock className="size-4 mr-1" />
                     {"Pending"}
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Accepted" value="accepted">
                     <Check className="size-4 mr-1" />
                     {"Accepted"}
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Expired" value="expired">
                     <X className="size-4 mr-1" />
                     {"Expired"}
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Canceled" value="canceled">
                     <XCircle className="size-4 mr-1" />
                     {"Canceled"}
                  </ToggleGroupItem>
               </ToggleGroup>
            </div>

            <div className="space-y-2">
               <p className="text-sm font-medium">{"Role"}</p>
               <ToggleGroup
                  className="flex-wrap justify-start"
                  onValueChange={(value) => onRoleFilterChange(value || "all")}
                  type="single"
                  value={roleFilter === "all" ? "" : roleFilter}
               >
                  <ToggleGroupItem aria-label="Owner" value="owner">
                     <Crown className="size-4 mr-1" />
                     {"Dono"}
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Admin" value="admin">
                     <Shield className="size-4 mr-1" />
                     {"Administrador"}
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Member" value="member">
                     <User className="size-4 mr-1" />
                     {"Membro"}
                  </ToggleGroupItem>
               </ToggleGroup>
            </div>

            {hasActiveFilters && (
               <Button
                  className="w-full"
                  onClick={onClearFilters}
                  variant="outline"
               >
                  <X className="size-4 mr-2" />
                  {"Clear"}
               </Button>
            )}
         </CredenzaBody>
         <CredenzaFooter>
            <Button className="w-full" onClick={closeCredenza}>
               {"Fechar"}
            </Button>
         </CredenzaFooter>
      </>
   );
}
