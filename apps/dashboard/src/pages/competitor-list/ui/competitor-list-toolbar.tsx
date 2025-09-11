import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CreateEditCompetitorDialog } from "../features/create-edit-competitor-dialog";

export function CompetitorListToolbar() {
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const navigate = useNavigate();

   const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      navigate({
         to: "/competitors",
         search: { page: 1, search: searchQuery || undefined },
      });
   };

   return (
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
         <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
               <Input
                  placeholder="Search competitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
               />
            </div>
            <Button type="submit" variant="outline" size="sm">
               Search
            </Button>
         </form>

         <Button
            onClick={() => setShowCreateDialog(true)}
            className="w-full sm:w-auto"
         >
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
         </Button>

         <CreateEditCompetitorDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
         />
      </div>
   );
}
