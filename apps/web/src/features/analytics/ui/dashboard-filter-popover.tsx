import type {
   Condition,
   NumberCondition,
   StringCondition,
} from "@f-o-t/condition-evaluator";
import type { Dashboard } from "@packages/database/schemas/dashboards";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   Select,
   SelectContent,
   SelectGroup,
   SelectItem,
   SelectLabel,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Separator } from "@packages/ui/components/separator";
import { cn } from "@packages/ui/lib/utils";
import { Filter, Plus, Trash2, X } from "lucide-react";
import { useId, useState } from "react";
import type { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Filter property definitions
// ─────────────────────────────────────────────────────────────────────────────

type PropertyDef = {
   field: string;
   label: string;
   type: "string" | "number";
};

const FILTER_PROPERTIES: PropertyDef[] = [
   { field: "contentId", label: "Conteúdo", type: "string" },
   { field: "userId", label: "Usuário", type: "string" },
   { field: "sessionId", label: "Sessão", type: "string" },
   { field: "organizationId", label: "Organização", type: "string" },
   { field: "eventCount", label: "Contagem de eventos", type: "number" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Operator sets from @f-o-t/condition-evaluator
// ─────────────────────────────────────────────────────────────────────────────

const STRING_OPERATORS: Array<{
   value: z.infer<typeof StringCondition>["operator"];
   label: string;
}> = [
   { value: "eq", label: "=" },
   { value: "neq", label: "≠" },
   { value: "contains", label: "contém" },
   { value: "not_contains", label: "não contém" },
   { value: "is_empty", label: "está vazio" },
   { value: "is_not_empty", label: "não está vazio" },
];

const NUMBER_OPERATORS: Array<{
   value: z.infer<typeof NumberCondition>["operator"];
   label: string;
}> = [
   { value: "eq", label: "=" },
   { value: "neq", label: "≠" },
   { value: "gt", label: ">" },
   { value: "gte", label: "≥" },
   { value: "lt", label: "<" },
   { value: "lte", label: "≤" },
];

// Operators that don't require a value input
const NO_VALUE_OPERATORS = new Set(["is_empty", "is_not_empty"]);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getPropertyDef(field: string): PropertyDef {
   return (
      FILTER_PROPERTIES.find((p) => p.field === field) ?? {
         field,
         label: field,
         type: "string",
      }
   );
}

function defaultOperatorFor(type: "string" | "number"): string {
   return type === "number" ? "eq" : "eq";
}

function buildCondition(
   id: string,
   field: string,
   type: "string" | "number",
   operator: string,
   value: string,
): Condition {
   if (type === "number") {
      return {
         id,
         type: "number",
         field,
         operator: operator as z.infer<typeof NumberCondition>["operator"],
         value: value !== "" ? Number(value) : undefined,
      };
   }
   return {
      id,
      type: "string",
      field,
      operator: operator as z.infer<typeof StringCondition>["operator"],
      value: NO_VALUE_OPERATORS.has(operator) ? undefined : value,
   };
}

// ─────────────────────────────────────────────────────────────────────────────
// Row state — flat representation for the form
// ─────────────────────────────────────────────────────────────────────────────

interface FilterRow {
   id: string;
   field: string;
   operator: string;
   value: string;
}

function conditionToRow(c: Condition): FilterRow {
   const field = "field" in c ? c.field : "";
   const operator = "operator" in c ? (c.operator as string) : "eq";
   const rawValue = "value" in c ? c.value : undefined;
   const value =
      rawValue === undefined || rawValue === null ? "" : String(rawValue);
   return { id: c.id, field, operator, value };
}

function rowToCondition(row: FilterRow): Condition {
   const def = getPropertyDef(row.field);
   return buildCondition(row.id, row.field, def.type, row.operator, row.value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardFilterPopoverProps {
   dashboard: Dashboard;
   onSave: (filters: Condition[]) => void;
   isPending?: boolean;
}

export function DashboardFilterPopover({
   dashboard,
   onSave,
   isPending = false,
}: DashboardFilterPopoverProps) {
   const uid = useId();
   const [open, setOpen] = useState(false);

   const savedFilters = (dashboard.globalFilters ?? []) as Condition[];
   const filterCount = savedFilters.length;

   const [rows, setRows] = useState<FilterRow[]>([]);

   const handleOpenChange = (next: boolean) => {
      if (next) setRows(savedFilters.map(conditionToRow));
      setOpen(next);
   };

   const handleAddFilter = () => {
      const newId = `${uid}-${Date.now()}`;
      setRows((prev) => [
         ...prev,
         { id: newId, field: "contentId", operator: "eq", value: "" },
      ]);
   };

   const handleRemove = (id: string) => {
      setRows((prev) => prev.filter((r) => r.id !== id));
   };

   const handleFieldChange = (id: string, field: string) => {
      const def = getPropertyDef(field);
      setRows((prev) =>
         prev.map((r) =>
            r.id === id
               ? {
                    ...r,
                    field,
                    operator: defaultOperatorFor(def.type),
                    value: "",
                 }
               : r,
         ),
      );
   };

   const handleOperatorChange = (id: string, operator: string) => {
      setRows((prev) =>
         prev.map((r) =>
            r.id === id
               ? {
                    ...r,
                    operator,
                    value: NO_VALUE_OPERATORS.has(operator) ? "" : r.value,
                 }
               : r,
         ),
      );
   };

   const handleValueChange = (id: string, value: string) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
   };

   const handleApply = () => {
      const conditions = rows.map(rowToCondition);
      onSave(conditions);
      setOpen(false);
   };

   const handleClearAll = () => {
      onSave([]);
      setOpen(false);
   };

   const hasChanges =
      JSON.stringify(rows) !== JSON.stringify(savedFilters.map(conditionToRow));

   return (
      <Popover onOpenChange={handleOpenChange} open={open}>
         <PopoverTrigger asChild>
            <Button
               className={cn(
                  "h-7 text-xs gap-1",
                  filterCount > 0 ? "text-foreground" : "text-muted-foreground",
               )}
               size="sm"
               variant="outline"
            >
               <Filter className="size-3" />
               Filtros
               {filterCount > 0 && (
                  <Badge
                     className="ml-0.5 h-4 px-1 text-xs"
                     variant="secondary"
                  >
                     {filterCount}
                  </Badge>
               )}
            </Button>
         </PopoverTrigger>

         <PopoverContent
            align="start"
            className="w-[560px] p-0"
            forceMount
            sideOffset={6}
         >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b">
               <span className="text-sm font-medium">Filtros do dashboard</span>
               {filterCount > 0 && (
                  <Button
                     className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                     disabled={isPending}
                     onClick={handleClearAll}
                     size="sm"
                     variant="ghost"
                  >
                     <X className="size-3 mr-1" />
                     Limpar todos
                  </Button>
               )}
            </div>

            {/* Column labels */}
            {rows.length > 0 && (
               <div className="grid grid-cols-[160px_140px_1fr_28px] gap-1.5 px-3 pt-2.5 pb-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                     Propriedade
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                     Condição
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                     Valor
                  </span>
                  <span />
               </div>
            )}

            {/* Filter rows */}
            <div className="flex flex-col gap-1.5 px-3 pt-1 pb-2.5">
               {rows.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-7 text-center">
                     <Filter className="size-6 text-muted-foreground/30" />
                     <p className="text-sm text-muted-foreground">
                        Nenhum filtro ativo
                     </p>
                     <p className="text-xs text-muted-foreground/60">
                        Filtros aplicados a todos os insights do dashboard
                     </p>
                  </div>
               ) : (
                  rows.map((row) => {
                     const def = getPropertyDef(row.field);
                     const operators =
                        def.type === "number"
                           ? NUMBER_OPERATORS
                           : STRING_OPERATORS;
                     const needsValue = !NO_VALUE_OPERATORS.has(row.operator);

                     return (
                        <div
                           className="grid grid-cols-[160px_140px_1fr_28px] gap-1.5 items-center"
                           key={row.id}
                        >
                           {/* Property */}
                           <Select
                              onValueChange={(v) =>
                                 handleFieldChange(row.id, v)
                              }
                              value={row.field}
                           >
                              <SelectTrigger className="h-7 text-xs">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectGroup>
                                    <SelectLabel className="text-[11px]">
                                       Texto
                                    </SelectLabel>
                                    {FILTER_PROPERTIES.filter(
                                       (p) => p.type === "string",
                                    ).map((prop) => (
                                       <SelectItem
                                          key={prop.field}
                                          value={prop.field}
                                       >
                                          {prop.label}
                                       </SelectItem>
                                    ))}
                                 </SelectGroup>
                                 <SelectGroup>
                                    <SelectLabel className="text-[11px]">
                                       Número
                                    </SelectLabel>
                                    {FILTER_PROPERTIES.filter(
                                       (p) => p.type === "number",
                                    ).map((prop) => (
                                       <SelectItem
                                          key={prop.field}
                                          value={prop.field}
                                       >
                                          {prop.label}
                                       </SelectItem>
                                    ))}
                                 </SelectGroup>
                              </SelectContent>
                           </Select>

                           {/* Operator */}
                           <Select
                              onValueChange={(v) =>
                                 handleOperatorChange(row.id, v)
                              }
                              value={row.operator}
                           >
                              <SelectTrigger className="h-7 text-xs">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {operators.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                       {op.label}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>

                           {/* Value */}
                           {needsValue ? (
                              <Input
                                 className="h-7 text-xs"
                                 onChange={(e) =>
                                    handleValueChange(row.id, e.target.value)
                                 }
                                 placeholder="valor..."
                                 type={
                                    def.type === "number" ? "number" : "text"
                                 }
                                 value={row.value}
                              />
                           ) : (
                              <div className="h-7 flex items-center px-2 text-xs text-muted-foreground italic">
                                 qualquer valor
                              </div>
                           )}

                           {/* Remove */}
                           <Button
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemove(row.id)}
                              size="icon"
                              type="button"
                              variant="ghost"
                           >
                              <Trash2 className="size-3.5" />
                           </Button>
                        </div>
                     );
                  })
               )}
            </div>

            <Separator />

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-3 py-2">
               <Button
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={handleAddFilter}
                  size="sm"
                  variant="ghost"
               >
                  <Plus className="size-3.5" />
                  Adicionar filtro
               </Button>

               <div className="flex items-center gap-1.5">
                  <Button
                     className="h-7 text-xs"
                     onClick={() => handleOpenChange(false)}
                     size="sm"
                     variant="ghost"
                  >
                     Cancelar
                  </Button>
                  <Button
                     className="h-7 text-xs"
                     disabled={isPending || !hasChanges}
                     onClick={handleApply}
                     size="sm"
                  >
                     {isPending ? "Aplicando..." : "Aplicar"}
                  </Button>
               </div>
            </div>
         </PopoverContent>
      </Popover>
   );
}
