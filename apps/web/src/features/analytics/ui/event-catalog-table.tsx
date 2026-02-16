import { Badge } from "@packages/ui/components/badge";
import { Input } from "@packages/ui/components/input";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { useState } from "react";

interface EventCatalogEntry {
   id: string;
   eventName: string;
   category: string;
   displayName: string;
   description: string | null;
   pricePerEvent: string;
   freeTierLimit: number;
   isBillable: boolean;
   isActive: boolean;
}

interface EventCatalogTableProps {
   events: EventCatalogEntry[];
}

export function EventCatalogTable({ events }: EventCatalogTableProps) {
   const [search, setSearch] = useState("");

   const filtered = events.filter(
      (event) =>
         event.eventName.toLowerCase().includes(search.toLowerCase()) ||
         event.displayName.toLowerCase().includes(search.toLowerCase()),
   );

   return (
      <div className="space-y-4">
         <Input
            className="max-w-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar eventos..."
            value={search}
         />

         <div className="rounded-md border">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Evento</TableHead>
                     <TableHead>Categoria</TableHead>
                     <TableHead className="text-right">Preço/evento</TableHead>
                     <TableHead className="text-right">Free tier</TableHead>
                     <TableHead>Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filtered.map((event) => (
                     <TableRow key={event.id}>
                        <TableCell>
                           <div>
                              <span className="font-mono text-sm">
                                 {event.eventName}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                 {event.displayName}
                              </p>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="secondary">{event.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                           R${event.pricePerEvent}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                           {event.freeTierLimit > 0
                              ? `${event.freeTierLimit.toLocaleString("pt-BR")}/mo`
                              : "-"}
                        </TableCell>
                        <TableCell>
                           <Badge
                              variant={event.isActive ? "default" : "secondary"}
                           >
                              {event.isActive ? "Ativo" : "Inativo"}
                           </Badge>
                        </TableCell>
                     </TableRow>
                  ))}
                  {filtered.length === 0 && (
                     <TableRow>
                        <TableCell
                           className="text-center py-8 text-muted-foreground"
                           colSpan={5}
                        >
                           Nenhum evento encontrado
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>
      </div>
   );
}
