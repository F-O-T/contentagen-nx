import type {
   Dashboard,
   DashboardFilter,
} from "@packages/database/schemas/dashboards";
import { Button } from "@packages/ui/components/button";
import { FieldGroup, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

// Available properties for filtering
const FILTER_PROPERTIES = [
   { value: "contentId", label: "ID do Conteúdo" },
   { value: "userId", label: "ID do Usuário" },
   { value: "sessionId", label: "ID da Sessão" },
   { value: "organizationId", label: "ID da Organização" },
] as const;

// Available operators
const FILTER_OPERATORS = [
   { value: "equals", label: "Igual a" },
   { value: "contains", label: "Contém" },
   { value: "gt", label: "Maior que" },
   { value: "lt", label: "Menor que" },
] as const;

interface DashboardFilterSheetProps {
   dashboard: Dashboard;
   isOpen: boolean;
   onClose: () => void;
   onSave: (filters: DashboardFilter[]) => void;
   isPending?: boolean;
}

export function DashboardFilterSheet({
   dashboard,
   isOpen,
   onClose,
   onSave,
   isPending = false,
}: DashboardFilterSheetProps) {
   const [filters, setFilters] = useState<DashboardFilter[]>(
      dashboard.globalFilters ?? [],
   );

   const handleAddFilter = () => {
      setFilters([
         ...filters,
         {
            property: "contentId",
            operator: "equals",
            value: "",
         },
      ]);
   };

   const handleRemoveFilter = (index: number) => {
      setFilters(filters.filter((_, i) => i !== index));
   };

   const handlePropertyChange = (index: number, property: string) => {
      const updated = [...filters];
      updated[index] = { ...updated[index], property };
      setFilters(updated);
   };

   const handleOperatorChange = (
      index: number,
      operator: "equals" | "contains" | "gt" | "lt",
   ) => {
      const updated = [...filters];
      updated[index] = { ...updated[index], operator };
      setFilters(updated);
   };

   const handleValueChange = (index: number, value: string) => {
      const updated = [...filters];
      updated[index] = { ...updated[index], value };
      setFilters(updated);
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(filters);
   };

   return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
         <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
            <SheetHeader>
               <SheetTitle>Filtros do Dashboard</SheetTitle>
               <SheetDescription>
                  Adicione filtros de propriedades que serão aplicados a todos os
                  insights deste dashboard.
               </SheetDescription>
            </SheetHeader>

            <form className="flex flex-col gap-4 py-6" onSubmit={handleSubmit}>
               {/* Filters list */}
               <div className="flex flex-col gap-3">
                  {filters.length === 0 ? (
                     <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                        <p>Nenhum filtro configurado</p>
                        <p className="text-xs">
                           Clique em "Adicionar filtro" para começar
                        </p>
                     </div>
                  ) : (
                     filters.map((filter, index) => (
                        <div
                           className="flex flex-col gap-3 rounded-lg border p-4"
                           key={`filter-${index.toString()}`}
                        >
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                 Filtro {index + 1}
                              </span>
                              <Button
                                 onClick={() => handleRemoveFilter(index)}
                                 size="sm"
                                 type="button"
                                 variant="ghost"
                              >
                                 <Trash2 className="size-4" />
                              </Button>
                           </div>

                           <div className="grid gap-3">
                              {/* Property select */}
                              <FieldGroup>
                                 <FieldLabel>Propriedade</FieldLabel>
                                 <Select
                                    onValueChange={(value) =>
                                       handlePropertyChange(index, value)
                                    }
                                    value={filter.property}
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Selecione uma propriedade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {FILTER_PROPERTIES.map((prop) => (
                                          <SelectItem
                                             key={prop.value}
                                             value={prop.value}
                                          >
                                             {prop.label}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </FieldGroup>

                              {/* Operator select */}
                              <FieldGroup>
                                 <FieldLabel>Operador</FieldLabel>
                                 <Select
                                    onValueChange={(value) =>
                                       handleOperatorChange(
                                          index,
                                          value as "equals" | "contains" | "gt" | "lt",
                                       )
                                    }
                                    value={filter.operator}
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Selecione um operador" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {FILTER_OPERATORS.map((op) => (
                                          <SelectItem key={op.value} value={op.value}>
                                             {op.label}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </FieldGroup>

                              {/* Value input */}
                              <FieldGroup>
                                 <FieldLabel>Valor</FieldLabel>
                                 <Input
                                    onChange={(e) =>
                                       handleValueChange(index, e.target.value)
                                    }
                                    placeholder="Digite o valor"
                                    value={filter.value}
                                 />
                              </FieldGroup>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               {/* Add filter button */}
               <Button
                  className="w-full"
                  onClick={handleAddFilter}
                  type="button"
                  variant="outline"
               >
                  <Plus className="size-4" />
                  Adicionar filtro
               </Button>

               <SheetFooter className="gap-2 sm:gap-0">
                  <Button
                     disabled={isPending}
                     onClick={onClose}
                     type="button"
                     variant="outline"
                  >
                     Cancelar
                  </Button>
                  <Button disabled={isPending} type="submit">
                     {isPending ? "Salvando..." : "Salvar filtros"}
                  </Button>
               </SheetFooter>
            </form>
         </SheetContent>
      </Sheet>
   );
}
