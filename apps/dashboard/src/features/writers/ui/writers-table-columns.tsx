import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

export type Writer = {
   id: string;
   personaConfig: {
      metadata: {
         name: string;
         description?: string;
      };
   };
   profilePhotoUrl?: string | null;
   contentCount: number;
   lastGeneratedAt?: Date | string | null;
   createdAt: Date | string;
};

export function createWriterColumns(slug: string): ColumnDef<Writer>[] {
   return [
      {
         accessorKey: "name",
         header: "Nome",
         cell: ({ row }) => {
            const writer = row.original;
            const name = writer.personaConfig.metadata.name;
            const initials = name
               .split(" ")
               .map((n) => n[0])
               .join("")
               .toUpperCase()
               .slice(0, 2);

            return (
               <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                     <AvatarImage
                        alt={name}
                        src={writer.profilePhotoUrl ?? undefined}
                     />
                     <AvatarFallback className="text-xs">
                        {initials}
                     </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                     <p className="font-medium truncate max-w-[200px]">
                        {name}
                     </p>
                     {writer.personaConfig.metadata.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                           {writer.personaConfig.metadata.description}
                        </p>
                     )}
                  </div>
               </div>
            );
         },
      },
      {
         accessorKey: "contentCount",
         header: "Conteúdos",
         cell: ({ row }) => (
            <span className="text-muted-foreground">
               {row.original.contentCount}
            </span>
         ),
      },
      {
         accessorKey: "createdAt",
         header: "Criado em",
         cell: ({ row }) => {
            const date =
               row.original.createdAt instanceof Date
                  ? row.original.createdAt
                  : new Date(row.original.createdAt);
            return (
               <span className="text-muted-foreground text-sm">
                  {date.toLocaleDateString("pt-BR", {
                     day: "2-digit",
                     month: "short",
                     year: "numeric",
                  })}
               </span>
            );
         },
      },
      {
         id: "actions",
         header: "",
         cell: ({ row }) => {
            const writer = row.original;

            return (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        asChild
                        className="size-8"
                        size="icon"
                        variant="ghost"
                     >
                        <Link
                           params={{ slug, writerId: writer.id }}
                           to="/$slug/writers/$writerId"
                        >
                           <Eye className="size-4" />
                        </Link>
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalhes</TooltipContent>
               </Tooltip>
            );
         },
      },
   ];
}
